public with sharing class RepairShopController {
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getProvinceOptions() {
        List<Map<String, String>> options = new List<Map<String, String>>();
        
        try {
            Schema.DescribeFieldResult fieldResult = Repair_Shop__c.Province__c.getDescribe();
            List<Schema.PicklistEntry> picklistValues = fieldResult.getPicklistValues();
            
            for(Schema.PicklistEntry entry : picklistValues) {
                if(entry.isActive()) {
                    Map<String, String> option = new Map<String, String>();
                    option.put('label', entry.getLabel());
                    option.put('value', entry.getValue());
                    options.add(option);
                }
            }
        } catch(Exception e) {
            System.debug('Error getting province options: ' + e.getMessage());
        }
        
        return options;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Repair_Shop__c> getRepairShops(String province, String city) {
        List<Repair_Shop__c> repairShops = new List<Repair_Shop__c>();
        
        try {
            // 필드 존재 여부 확인
            Map<String, Schema.SObjectField> fieldMap = Schema.SObjectType.Repair_Shop__c.fields.getMap();
            Boolean hasCoordinateFields = fieldMap.containsKey('Latitude__c') && fieldMap.containsKey('Longitude__c');
            
            if (hasCoordinateFields) {
                repairShops = [
                    SELECT Id, Name, Address__c, Province__c, City__c, Phone_Number__c, Latitude__c, Longitude__c
                    FROM Repair_Shop__c 
                    WHERE Province__c = :province AND City__c = :city
                    ORDER BY Name
                ];
            } else {
                System.debug('⚠️ Latitude__c 또는 Longitude__c 필드가 없습니다. 기본 필드만 조회합니다.');
                repairShops = [
                    SELECT Id, Name, Address__c, Province__c, City__c, Phone_Number__c
                    FROM Repair_Shop__c 
                    WHERE Province__c = :province AND City__c = :city
                    ORDER BY Name
                ];
                
                // 좌표 필드가 없는 경우 null로 설정
                for (Repair_Shop__c shop : repairShops) {
                    shop.put('Latitude__c', null);
                    shop.put('Longitude__c', null);
                }
            }
            
            System.debug('📊 조회된 정비소 수: ' + repairShops.size());
            
            // 🎯 핵심: 잘못된 좌표를 가진 정비소들을 포함해서 모두 일괄 업데이트
            if (hasCoordinateFields) {
                // 모든 정비소를 다시 업데이트 (기존 좌표 무시)
                List<Id> shopsToUpdate = new List<Id>();
                for (Repair_Shop__c shop : repairShops) {
                    if (String.isNotBlank(shop.Address__c)) {
                        shopsToUpdate.add(shop.Id);
                    }
                }
                
                if (!shopsToUpdate.isEmpty()) {
                    System.debug('🔄 모든 정비소 좌표 재생성 시작 - 대상: ' + shopsToUpdate.size() + '개');
                    updateMissingCoordinatesInBackground(shopsToUpdate);
                }
            }
            
        } catch(Exception e) {
            System.debug('Error getting repair shops: ' + e.getMessage());
        }
        
        return repairShops;
    }
    
    // 좌표가 없는 정비소들을 백그라운드에서 일괄 업데이트
    @future(callout=true)
    public static void updateMissingCoordinatesInBackground(List<Id> shopIds) {
        List<Repair_Shop__c> shopsToUpdate = new List<Repair_Shop__c>();
        
        System.debug('🔄 백그라운드 좌표 업데이트 시작 - 대상 정비소 수: ' + shopIds.size());
        
        // ID로 정비소 정보 다시 조회
        List<Repair_Shop__c> shops = [
            SELECT Id, Name, Address__c, Latitude__c, Longitude__c
            FROM Repair_Shop__c 
            WHERE Id IN :shopIds
            LIMIT 3  // API 호출 제한을 위해 한 번에 3개까지만
        ];
        
        for (Repair_Shop__c shop : shops) {
            // 주소가 있는 정비소만 처리
            if (String.isBlank(shop.Address__c)) {
                System.debug('⚠️ ' + shop.Name + ' - 주소 정보가 없어 건너뜀');
                continue;
            }
            
            // 실제 저장된 주소 데이터 확인
            System.debug('🏢 정비소: ' + shop.Name + ' | 저장된 주소: "' + shop.Address__c + '"');
            
            // 정비소별 구체적인 주소 사용 (서초구 정비소들 구분을 위해)
            String specificAddress = getSpecificAddress(shop.Name, shop.Address__c);
            
            try {
                Map<String, Decimal> coordinates = GoogleMapsController.getCoordinatesFromAddress(specificAddress);
                
                if (coordinates != null && coordinates.containsKey('latitude') && coordinates.containsKey('longitude')) {
                    Repair_Shop__c shopToUpdate = new Repair_Shop__c(
                        Id = shop.Id,
                        Latitude__c = coordinates.get('latitude'),
                        Longitude__c = coordinates.get('longitude')
                    );
                    shopsToUpdate.add(shopToUpdate);
                    
                    System.debug('✅ ' + shop.Name + ' 새로운 좌표 준비 완료: Lat=' + coordinates.get('latitude') + ', Lng=' + coordinates.get('longitude'));
                } else {
                    System.debug('❌ ' + shop.Name + ' 좌표 조회 실패 - 주소: ' + specificAddress);
                }
            } catch (Exception e) {
                System.debug('❌ ' + shop.Name + ' 좌표 생성 실패: ' + e.getMessage());
            }
        }
        
        // 일괄 업데이트 실행
        if (!shopsToUpdate.isEmpty()) {
            try {
                update shopsToUpdate;
                System.debug('🎯 ' + shopsToUpdate.size() + '개 정비소 좌표 일괄 업데이트 완료');
            } catch (DmlException e) {
                System.debug('❌ 일괄 업데이트 실패: ' + e.getMessage());
                for (Integer i = 0; i < e.getNumDml(); i++) {
                    System.debug('❌ DML Error ' + i + ': ' + e.getDmlMessage(i));
                }
            }
        } else {
            System.debug('⚠️ 업데이트할 좌표가 없습니다.');
        }
    }
    
    // 정비소별 구체적 주소 반환 (서초구 정비소들 구분용)
    private static String getSpecificAddress(String shopName, String originalAddress) {
        // 서초구 정비소들에 대해 구체적인 주소 매핑
        Map<String, String> specificAddresses = new Map<String, String>{
            'CRM오토큐 서초남부점' => '서울특별시 서초구 남부순환로 2085',
            'CRM오토큐 방배점' => '서울특별시 서초구 방배로 173',
            'CRM오토큐 서초점' => '서울특별시 서초구 서초대로 398',
            'CRM오토큐 서초중앙점' => '서울특별시 서초구 효령로 265',
            'CRM오토큐 반포점' => '서울특별시 서초구 반포대로 145'
        };
        
        // 매핑된 주소가 있으면 사용, 없으면 원래 주소 사용
        if (specificAddresses.containsKey(shopName)) {
            System.debug('🎯 ' + shopName + '에 대한 구체적 주소 사용: ' + specificAddresses.get(shopName));
            return specificAddresses.get(shopName);
        }
        
        System.debug('📍 ' + shopName + '에 대한 일반 주소 사용: ' + originalAddress);
        return originalAddress;
    }
}