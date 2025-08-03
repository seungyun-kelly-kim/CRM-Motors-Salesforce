public with sharing class WarrantyController {
    
    @AuraEnabled(cacheable=true)
    public static List<Warranty__c> getWarrantiesByAccount(Id accountId) {
        try {
            return [
                SELECT Id, Name, Registration_Date__c, Expiration_Date__c, 
                       Warranty_Period__c, Warranty_Mileage__c, Warranty_Related_Asset__c
                FROM Warranty__c 
                WHERE Warranty_Related_Account__c = :accountId
                ORDER BY Registration_Date__c DESC
            ];
        } catch (Exception e) {
            throw new AuraHandledException('보증 정보 조회 중 오류가 발생했습니다: ' + e.getMessage());
        }
    }
}