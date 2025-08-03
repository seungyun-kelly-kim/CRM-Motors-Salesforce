public with sharing class TodayVisitReservationController {
    
    @AuraEnabled(cacheable=false)
    public static List<Case> getTodayVisitReservations() {
        try {
            // 오늘 날짜 범위로 필터링 (DateTime 필드 대응)
            DateTime startOfToday = DateTime.newInstance(Date.today(), Time.newInstance(0, 0, 0, 0));
            DateTime endOfToday = DateTime.newInstance(Date.today(), Time.newInstance(23, 59, 59, 0));
            
            System.debug('🔍 [TodayVisit] 오늘 날짜: ' + Date.today());
            System.debug('🔍 [TodayVisit] 조회 범위: ' + startOfToday + ' ~ ' + endOfToday);
            
            // 먼저 모든 Case 수 확인
            Integer totalCases = [SELECT COUNT() FROM Case];
            System.debug('🔍 [TodayVisit] 전체 Case 수: ' + totalCases);
            
            // Preferred_Date__c가 있는 Case 수 확인
            Integer casesWithPreferredDate = [SELECT COUNT() FROM Case WHERE Preferred_Date__c != null];
            System.debug('🔍 [TodayVisit] Preferred_Date__c가 있는 Case 수: ' + casesWithPreferredDate);
            
            // 최근 5개 Case의 Preferred_Date__c 값 확인
            List<Case> recentCases = [
                SELECT Id, CaseNumber, Preferred_Date__c, Status, CreatedDate
                FROM Case 
                WHERE Preferred_Date__c != null
                ORDER BY CreatedDate DESC 
                LIMIT 5
            ];
            System.debug('🔍 [TodayVisit] 최근 5개 Case:');
            for (Case c : recentCases) {
                System.debug('  - ' + c.CaseNumber + ': ' + c.Preferred_Date__c + ' (Status: ' + c.Status + ')');
            }
            
            // 케이스 조회 (Status 조건 완화)
            List<Case> todayReservations = [
                SELECT Id,
                       CaseNumber,
                       Subject,
                       Status,
                       Preferred_Date__c,
                       ServiceReservationType__c,
                       ContactPhone,
                       Contact.Name,
                       Account.Name,
                       TechnicianPerCase__r.Name
                FROM Case
                WHERE Preferred_Date__c >= :startOfToday
                  AND Preferred_Date__c <= :endOfToday
                  AND (Status = 'New' OR Status = 'Working' OR Status = '배정')
                ORDER BY Preferred_Date__c ASC
                LIMIT 50
            ];
            
            System.debug('🔍 [TodayVisit] 조회된 오늘 케이스 수: ' + todayReservations.size());
            
            return todayReservations;
            
        } catch (Exception e) {
            System.debug('Error: ' + e.getMessage());
            System.debug('Stack Trace: ' + e.getStackTraceString());
            throw new AuraHandledException('오류 발생: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getRepairShops() {
        try {
            List<Map<String, String>> repairShopOptions = new List<Map<String, String>>();
            
            List<Repair_Shop__c> repairShops = [
                SELECT Id, Name, Address__c, Phone_Number__c
                FROM Repair_Shop__c
                ORDER BY Name ASC
            ];
            
            for (Repair_Shop__c shop : repairShops) {
                repairShopOptions.add(new Map<String, String>{
                    'label' => shop.Name,
                    'value' => shop.Id,
                    'address' => shop.Address__c,
                    'phone' => shop.Phone_Number__c
                });
            }
            
            return repairShopOptions;
            
        } catch (Exception e) {
            throw new AuraHandledException('정비소 목록 조회 중 오류가 발생했습니다: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static String assignTechnician(String caseId, String technicianId) {
        if (String.isBlank(caseId) || String.isBlank(technicianId)) {
            throw new AuraHandledException('케이스 ID와 정비사 ID가 필요합니다.');
        }
        
        try {
            Case caseToUpdate = [
                SELECT Id, TechnicianPerCase__c
                FROM Case
                WHERE Id = :caseId
                LIMIT 1
            ];
            
            caseToUpdate.TechnicianPerCase__c = technicianId;
            update caseToUpdate;
            
            return '정비사가 성공적으로 배정되었습니다.';
            
        } catch (DmlException e) {
            throw new AuraHandledException('정비사 배정 중 오류가 발생했습니다: ' + e.getDmlMessage(0));
        } catch (QueryException e) {
            throw new AuraHandledException('케이스를 찾을 수 없습니다: ' + e.getMessage());
        } catch (Exception e) {
            throw new AuraHandledException('예상치 못한 오류가 발생했습니다: ' + e.getMessage());
        }
    }
}