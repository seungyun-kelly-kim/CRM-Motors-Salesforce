public with sharing class AccountInfoController {
    
    @AuraEnabled(cacheable=true)
    public static Account getAccountInfo(Id accountId) {
        try {
            return [
                SELECT Id, Name, Phone, PersonEmail, PersonMobilePhone, 
                       PersonBirthdate, Gender__c, PersonMailingAddress, 
                       Marketing_Consent__c, PersonMailingStreet, 
                       PersonMailingCity, PersonMailingState, PersonMailingCountry
                FROM Account 
                WHERE Id = :accountId
                LIMIT 1
            ];
        } catch (Exception e) {
            throw new AuraHandledException('고객 정보 조회 중 오류가 발생했습니다: ' + e.getMessage());
        }
    }
}