public with sharing class RepairReservationScheduler {
    public class TimeSlotWrapper {
        @AuraEnabled public String label;
        @AuraEnabled public Integer remaining;
        @AuraEnabled public String startTime;

        public TimeSlotWrapper(String label, Integer remaining, String startTime) {
            this.label = label;
            this.remaining = remaining;
            this.startTime = startTime;
        }
    }

    // ✅ STEP.5 시간 슬롯 조회
    @AuraEnabled(cacheable=true)
    public static List<TimeSlotWrapper> getAvailableTimeSlots(Date selectedDate, Id repairShopId, String selectedDetails) {
        List<TimeSlotWrapper> result = new List<TimeSlotWrapper>();
        String[] weekdays = new List<String>{'일', '월', '화', '수', '목', '금', '토'};
        Integer dayIndex = (Integer)selectedDate.toStartOfWeek().daysBetween(selectedDate);
        String dayOfWeek = weekdays[dayIndex];

        List<OperatingHours__c> ops = [
            SELECT Id, StartOperation__c, EndOperation__c
            FROM OperatingHours__c
            WHERE OperationRepairShop__c = :repairShopId AND Name = :dayOfWeek
        ];
        if (ops.isEmpty()) return result;

        OperatingHours__c op = ops[0];
        Time startTime = op.StartOperation__c;
        Time endTime = op.EndOperation__c;

        // ✅ 스킬 기반 기술자 필터링
        Set<String> requiredSkills = getRequiredSkills(selectedDetails);
        System.debug('🛠️ [시간슬롯] selectedDetails: ' + selectedDetails);
        System.debug('🛠️ [시간슬롯] 필요한 스킬: ' + requiredSkills);
        
        Set<Id> qualifiedTechIds = new Set<Id>();
        
        if (requiredSkills.isEmpty()) {
            // 스킬 요구사항이 없으면 모든 근무 기술자 포함
            List<WorkingHour__c> working = [
                SELECT SelectTechnician__c
                FROM WorkingHour__c
                WHERE OperationTechnician__c = :op.Id
            ];
            for (WorkingHour__c wh : working) {
                qualifiedTechIds.add(wh.SelectTechnician__c);
            }
        } else {
            // 필요한 스킬을 가진 기술자만 포함
            List<TechnicianSkillset__c> techSkills = [
                SELECT SkillsetTechnician__c, SkillsetperTechnician__r.Name
                FROM TechnicianSkillset__c
                WHERE SkillsetTechnician__r.TechnicianRepairShop__c = :repairShopId
                AND SkillsetperTechnician__r.Name IN :requiredSkills
            ];
            System.debug('🔍 [시간슬롯] 조회된 TechnicianSkillset 수: ' + techSkills.size());
            System.debug('🔍 [시간슬롯] repairShopId: ' + repairShopId);
            
            // 스킬을 가진 정비사들을 그룹핑
            Map<Id, Set<String>> techSkillMap = new Map<Id, Set<String>>();
            for (TechnicianSkillset__c ts : techSkills) {
                if (!techSkillMap.containsKey(ts.SkillsetTechnician__c)) {
                    techSkillMap.put(ts.SkillsetTechnician__c, new Set<String>());
                }
                techSkillMap.get(ts.SkillsetTechnician__c).add(ts.SkillsetperTechnician__r.Name);
            }
            
            // 모든 필요한 스킬을 가진 정비사만 선택하고, 해당 날짜에 근무하는지 확인
            List<WorkingHour__c> working = [
                SELECT SelectTechnician__c
                FROM WorkingHour__c
                WHERE OperationTechnician__c = :op.Id
            ];
            Set<Id> workingTechIds = new Set<Id>();
            for (WorkingHour__c wh : working) {
                workingTechIds.add(wh.SelectTechnician__c);
            }
            
            for (Id techId : techSkillMap.keySet()) {
                Set<String> techSkillSet = techSkillMap.get(techId);
                if (techSkillSet.containsAll(requiredSkills) && workingTechIds.contains(techId)) {
                    qualifiedTechIds.add(techId);
                }
            }
        }
        
        if (qualifiedTechIds.isEmpty()) return result;
        System.debug('👨‍🔧 [시간슬롯] 적합한 기술자 수: ' + qualifiedTechIds.size());

        DateTime startOfDay = DateTime.newInstance(selectedDate, Time.newInstance(0,0,0,0));
        DateTime endOfDay = DateTime.newInstance(selectedDate, Time.newInstance(23,59,59,0));

        List<Case> existingCases = [
            SELECT Preferred_Date__c, TechnicianPerCase__c
            FROM Case
            WHERE TechnicianPerCase__c IN :qualifiedTechIds
              AND Preferred_Date__c >= :startOfDay AND Preferred_Date__c <= :endOfDay
        ];

        Map<Time, Integer> slotCount = new Map<Time, Integer>();
        for (Case c : existingCases) {
            Time slotTime = Time.newInstance(c.Preferred_Date__c.hour(), c.Preferred_Date__c.minute(), 0, 0);
            slotCount.put(slotTime, slotCount.containsKey(slotTime) ? slotCount.get(slotTime) + 1 : 1);
        }

        for (Time t = startTime; t.addMinutes(90) <= endTime; t = t.addMinutes(90)) {
            if (t >= Time.newInstance(13,0,0,0) && t < Time.newInstance(14,30,0,0)) continue;

            Time tEnd = t.addMinutes(90);
            String label = pad(t.hour()) + ':' + pad(t.minute()) + ' - ' + pad(tEnd.hour()) + ':' + pad(tEnd.minute());
            Integer used = slotCount.containsKey(t) ? slotCount.get(t) : 0;
            Integer remaining = qualifiedTechIds.size() - used;

            result.add(new TimeSlotWrapper(label, remaining, pad(t.hour()) + ':' + pad(t.minute())));
        }
        return result;
    }

    private static String pad(Integer n) {
        return n < 10 ? '0' + String.valueOf(n) : String.valueOf(n);
    }
    
    // ✅ 세부 정비 항목에서 기술 역량 매핑
    private static Set<String> getRequiredSkills(String selectedDetails) {
        Set<String> requiredSkills = new Set<String>();
        
        System.debug('🔍 [getRequiredSkills] 입력받은 selectedDetails: "' + selectedDetails + '"');
        System.debug('🔍 [getRequiredSkills] selectedDetails가 null인가?: ' + (selectedDetails == null));
        System.debug('🔍 [getRequiredSkills] selectedDetails가 blank인가?: ' + String.isBlank(selectedDetails));
        
        if (String.isBlank(selectedDetails)) {
            System.debug('⚠️ [getRequiredSkills] selectedDetails가 비어있어서 빈 스킬 셋 반환');
            return requiredSkills;
        }
        
        List<String> detailsList = selectedDetails.split(';');
        System.debug('🔍 [getRequiredSkills] 분할된 detailsList: ' + detailsList);
        System.debug('🔍 [getRequiredSkills] detailsList 크기: ' + detailsList.size());
        
        for (String detail : detailsList) {
            String trimmedDetail = detail.trim();
            System.debug('🔍 [getRequiredSkills] 처리 중인 detail: "' + trimmedDetail + '"');
            
            // 엔진 관련 역량
            if (trimmedDetail == 'engine_problem' || trimmedDetail == 'noise_vibration' || trimmedDetail == 'engine_oil_filter') {
                requiredSkills.add('엔진');
                System.debug('✅ [getRequiredSkills] 엔진 스킬 추가됨');
            }
            // 변속기 관련 역량
            else if (trimmedDetail == 'transmission' || trimmedDetail == 'transmission_oil') {
                requiredSkills.add('변속기');
                System.debug('✅ [getRequiredSkills] 변속기 스킬 추가됨');
            }
            // 전장 관련 역량
            else if (trimmedDetail == 'fuse_lamp_battery' || trimmedDetail == 'warning_lights') {
                requiredSkills.add('전장(전기/전장품)');
                System.debug('✅ [getRequiredSkills] 전장 스킬 추가됨');
            }
            // 소모품/경정비 관련 역량
            else if (trimmedDetail == 'wiper_blades' || trimmedDetail == 'air_conditioning_refrigerant' || 
                     trimmedDetail == 'washer_fluid_coolant' || trimmedDetail == 'other_consumables') {
                requiredSkills.add('소모품/경정비');
                System.debug('✅ [getRequiredSkills] 소모품/경정비 스킬 추가됨');
            }
            // HVAC 관련 역량 (에어컨 냉매는 두 카테고리에 포함될 수 있음)
            else if (trimmedDetail == 'air_conditioning_refrigerant') {
                requiredSkills.add('에어컨/HVAC');
                System.debug('✅ [getRequiredSkills] 에어컨/HVAC 스킬 추가됨');
            }
            else {
                System.debug('⚠️ [getRequiredSkills] 매칭되지 않은 detail: "' + trimmedDetail + '"');
            }
        }
        
        System.debug('🛠️ [getRequiredSkills] 최종 requiredSkills: ' + requiredSkills);
        return requiredSkills;
    }
    
    // ✅ 해당 정비소에서 필요한 스킬을 가진 정비사 조회
    private static List<Id> getQualifiedTechnicians(Id repairShopId, Set<String> requiredSkills, DateTime preferredDateTime) {
        List<Id> qualifiedTechIds = new List<Id>();
        
        if (requiredSkills.isEmpty()) {
            return qualifiedTechIds;
        }
        
        // 1. 해당 정비소의 정비사들 중에서 필요한 스킬을 가진 정비사 조회
        List<TechnicianSkillset__c> techSkills = [
            SELECT SkillsetTechnician__c, SkillsetperTechnician__r.Name
            FROM TechnicianSkillset__c
            WHERE SkillsetTechnician__r.TechnicianRepairShop__c = :repairShopId
            AND SkillsetperTechnician__r.Name IN :requiredSkills
        ];
        
        // 2. 스킬을 가진 정비사들을 그룹핑
        Map<Id, Set<String>> techSkillMap = new Map<Id, Set<String>>();
        for (TechnicianSkillset__c ts : techSkills) {
            if (!techSkillMap.containsKey(ts.SkillsetTechnician__c)) {
                techSkillMap.put(ts.SkillsetTechnician__c, new Set<String>());
            }
            techSkillMap.get(ts.SkillsetTechnician__c).add(ts.SkillsetperTechnician__r.Name);
        }
        
        // 3. 모든 필요한 스킬을 가진 정비사만 선택
        for (Id techId : techSkillMap.keySet()) {
            Set<String> techSkillSet = techSkillMap.get(techId);
            if (techSkillSet.containsAll(requiredSkills)) {
                // 4. 해당 시간에 다른 케이스가 배정되지 않은 정비사만 선택
                if (isTechnicianAvailable(techId, preferredDateTime)) {
                    qualifiedTechIds.add(techId);
                }
            }
        }
        
        return qualifiedTechIds;
    }
    
    // ✅ 해당 시간에 정비사가 이용 가능한지 확인
    private static Boolean isTechnicianAvailable(Id technicianId, DateTime preferredDateTime) {
        // 90분 슬롯 기준으로 겹치는 시간대 체크
        DateTime slotStart = preferredDateTime;
        DateTime slotEnd = preferredDateTime.addMinutes(90);
        
        List<Case> conflictCases = [
            SELECT Id
            FROM Case
            WHERE TechnicianPerCase__c = :technicianId
            AND Preferred_Date__c >= :slotStart.addMinutes(-90)  // 이전 슬롯과 겹치는 경우
            AND Preferred_Date__c < :slotEnd  // 다음 슬롯과 겹치는 경우
        ];
        
        return conflictCases.isEmpty();
    }

    // ✅ 정비사 미리보기 정보를 담는 래퍼 클래스
    public class TechnicianPreviewResult {
        @AuraEnabled public String technicianName;
        @AuraEnabled public String technicianId;
        @AuraEnabled public Boolean available;
        @AuraEnabled public String message;
        
        public TechnicianPreviewResult(String technicianName, String technicianId, Boolean available, String message) {
            this.technicianName = technicianName;
            this.technicianId = technicianId;
            this.available = available;
            this.message = message;
        }
    }

    // ✅ STEP.6 정비사 미리 조회 (Case 생성 전)
    @AuraEnabled(cacheable=true)
    public static TechnicianPreviewResult previewTechnicianAssignment(
        Id repairShopId,
        String preferredDate,
        String selectedDetails
    ) {
        System.debug('🔍 [미리보기] 정비사 조회 시작');
        
        try {
            DateTime parsedDateTime;
            // 날짜 파싱
            List<String> parts = preferredDate.split(' ');
            List<String> dateParts = parts[0].split('-');
            List<String> timeParts = parts[1].split(':');
            
            Integer year = Integer.valueOf(dateParts[0]);
            Integer month = Integer.valueOf(dateParts[1]);
            Integer day = Integer.valueOf(dateParts[2]);
            Integer hour = Integer.valueOf(timeParts[0]);
            Integer minute = Integer.valueOf(timeParts[1]);
            Integer second = Integer.valueOf(timeParts[2]);
            
            parsedDateTime = DateTime.newInstance(year, month, day, hour, minute, second);
            
            Set<String> requiredSkills = getRequiredSkills(selectedDetails);
            List<Id> qualifiedTechnicians = getQualifiedTechnicians(repairShopId, requiredSkills, parsedDateTime);
            
            if (!qualifiedTechnicians.isEmpty()) {
                // 랜덤으로 정비사 선택
                Integer randomIndex = Math.mod(Math.abs(Crypto.getRandomInteger()), qualifiedTechnicians.size());
                Id selectedTechnicianId = qualifiedTechnicians[randomIndex];
                
                // 정비사 이름 조회
                List<Technician__c> techs = [
                    SELECT Name
                    FROM Technician__c 
                    WHERE Id = :selectedTechnicianId
                    LIMIT 1
                ];
                
                String technicianName = !techs.isEmpty() ? techs[0].Name : '정비사';
                
                return new TechnicianPreviewResult(
                    technicianName,
                    selectedTechnicianId,
                    true,
                    technicianName + ' 정비사가 배정 예정입니다.'
                );
            } else {
                return new TechnicianPreviewResult(
                    null,
                    null,
                    false,
                    '현재 시간대에 가능한 정비사가 없습니다. 다른 시간을 선택해주세요.'
                );
            }
        } catch (Exception e) {
            System.debug('❌ 정비사 미리보기 실패: ' + e.getMessage());
            return new TechnicianPreviewResult(
                null,
                null,
                false,
                '정비사 조회 중 오류가 발생했습니다.'
            );
        }
    }

    // ✅ 배정된 정비사 정보를 담는 래퍼 클래스
    public class TechnicianAssignmentResult {
        @AuraEnabled public String technicianName;
        @AuraEnabled public String technicianId;
        @AuraEnabled public Boolean success;
        @AuraEnabled public String message;
        
        public TechnicianAssignmentResult(String technicianName, String technicianId, Boolean success, String message) {
            this.technicianName = technicianName;
            this.technicianId = technicianId;
            this.success = success;
            this.message = message;
        }
    }

    // ✅ STEP.6 예약 및 기술자 배정 (정비사 정보 반환)
    @AuraEnabled
    public static TechnicianAssignmentResult assignTechnicianAndCreateCase(
        Id accountId,
        Id assetId,
        Id repairShopId,
        String preferredDate,
        String selectedDetails,
        String serviceType,
        String serviceTypeValue,
        String description
    ) {
        System.debug('🚀 [assignTechnicianAndCreateCase] 시작');
        System.debug('📝 preferredDate 파라미터: ' + preferredDate);
        System.debug('📝 selectedDetails: ' + selectedDetails);
        System.debug('📝 serviceType: ' + serviceType);

        DateTime parsedDateTime;
        try {
            System.debug('🕐 입력받은 날짜 문자열: ' + preferredDate);
            
            // 문자열을 직접 파싱해서 한국 시간대 기준으로 DateTime 생성
            // 형식: "2025-07-31 17:30:00"
            List<String> parts = preferredDate.split(' ');
            List<String> dateParts = parts[0].split('-');
            List<String> timeParts = parts[1].split(':');
            
            Integer year = Integer.valueOf(dateParts[0]);
            Integer month = Integer.valueOf(dateParts[1]);
            Integer day = Integer.valueOf(dateParts[2]);
            Integer hour = Integer.valueOf(timeParts[0]);
            Integer minute = Integer.valueOf(timeParts[1]);
            Integer second = Integer.valueOf(timeParts[2]);
            
            // 한국 시간대로 직접 생성 (TimeZone 변환 없음)
            parsedDateTime = DateTime.newInstance(year, month, day, hour, minute, second);
            
            System.debug('🕐 직접 파싱된 DateTime (KST): ' + parsedDateTime);
            System.debug('🌏 현재 사용자 TimeZone: ' + UserInfo.getTimeZone().getID());
        } catch (Exception e) {
            System.debug('❌ DateTime 파싱 실패: ' + e.getMessage());
            throw new AuraHandledException('날짜 형식이 잘못되었습니다.');
        }

        // Asset 이름 조회
        String assetName = '차량';
        try {
            List<Asset> assets = [
                SELECT Name 
                FROM Asset 
                WHERE AccountId = :accountId 
                ORDER BY CreatedDate DESC 
                LIMIT 1
            ];
            if (!assets.isEmpty()) {
                assetName = assets[0].Name;
            }
        } catch (Exception e) {
            System.debug('Asset 조회 실패: ' + e.getMessage());
        }

        // ✅ 스킬 기반 정비사 배정 로직
        Set<String> requiredSkills = getRequiredSkills(selectedDetails);
        System.debug('🛠️ 필요한 스킬: ' + requiredSkills);
        
        List<Id> qualifiedTechnicians = getQualifiedTechnicians(repairShopId, requiredSkills, parsedDateTime);
        System.debug('👨‍🔧 적합한 정비사 수: ' + qualifiedTechnicians.size());
        
        Id assignedTechnicianId = null;
        String assignedTechnicianName = null;
        String caseStatus = 'New';
        
        if (!qualifiedTechnicians.isEmpty()) {
            // 랜덤으로 정비사 선택
            Integer randomIndex = Math.mod(Math.abs(Crypto.getRandomInteger()), qualifiedTechnicians.size());
            assignedTechnicianId = qualifiedTechnicians[randomIndex];
            caseStatus = '배정';
            
            // 배정된 정비사 이름 조회
            try {
                List<Technician__c> techs = [
                    SELECT Name
                    FROM Technician__c 
                    WHERE Id = :assignedTechnicianId
                    LIMIT 1
                ];
                if (!techs.isEmpty()) {
                    assignedTechnicianName = techs[0].Name;
                }
            } catch (Exception e) {
                System.debug('정비사 이름 조회 실패: ' + e.getMessage());
                assignedTechnicianName = '정비사';
            }
            
            System.debug('✅ 배정된 정비사: ' + assignedTechnicianId + ' (' + assignedTechnicianName + ')');
        } else {
            System.debug('⚠️ 적합한 정비사가 없어서 수동 배정 필요');
            caseStatus = 'New';
        }

        Case c = new Case(
            AccountId = accountId,
            AssetId = assetId,
            Repair_Shop__c = repairShopId,
            TechnicianPerCase__c = assignedTechnicianId,
            Preferred_Date__c = parsedDateTime,
            Status = caseStatus,
            Subject = '[' + String.valueOf(parsedDateTime.date()) + '] ' + assetName,
            Service_Type__c = serviceTypeValue,
            ServiceReservationType__c = serviceType,
            ServiceReservationTypeDetails__c = selectedDetails,
            Description = description,
            Origin = 'Web'
        );

        try {
            insert c;
            System.debug('✅ Case 생성 성공: ' + c.Id);
            System.debug('📊 최종 상태 - Status: ' + caseStatus + ', 정비사: ' + assignedTechnicianId);
            
            // 성공 결과 반환
            if (assignedTechnicianId != null && assignedTechnicianName != null) {
                return new TechnicianAssignmentResult(
                    assignedTechnicianName,
                    assignedTechnicianId,
                    true,
                    assignedTechnicianName + ' 정비사가 배정되었습니다.'
                );
            } else {
                return new TechnicianAssignmentResult(
                    null,
                    null,
                    true,
                    '예약이 접수되었습니다. 정비사는 추후 배정될 예정입니다.'
                );
            }
        } catch (DmlException e) {
            System.debug('❌ DML 실패: ' + e.getMessage());
            return new TechnicianAssignmentResult(
                null,
                null,
                false,
                '예약 접수 중 오류가 발생했습니다: ' + e.getDmlMessage(0)
            );
        }
    }

    // ✅ Picklist 라벨 매핑 조회
    @AuraEnabled(cacheable=true)
    public static Map<String, String> getPicklistLabelMap(String objectName, String fieldName) {
        Map<String, String> labelMap = new Map<String, String>();
        
        try {
            Schema.SObjectType targetType = Schema.getGlobalDescribe().get(objectName);
            Schema.DescribeSObjectResult describe = targetType.getDescribe();
            Schema.DescribeFieldResult fieldDescribe = describe.fields.getMap().get(fieldName).getDescribe();
            
            for (Schema.PicklistEntry entry : fieldDescribe.getPicklistValues()) {
                if (entry.isActive()) {
                    labelMap.put(entry.getValue(), entry.getLabel());
                }
            }
        } catch (Exception e) {
            System.debug('Error getting picklist label map: ' + e.getMessage());
        }
        
        return labelMap;
    }
}