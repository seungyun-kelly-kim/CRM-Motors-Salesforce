public with sharing class ReservationSubmitController {
    @AuraEnabled
    public static void createFinalReservationCase(
        Id accountId,
        Id repairShopId,
        String preferredDate,
        String selectedDetails,
        String description
    ) {
        System.debug('📥 [createFinalReservationCase 호출됨]');
        System.debug('➡️ accountId: ' + accountId);
        System.debug('➡️ repairShopId: ' + repairShopId);
        System.debug('➡️ preferredDate: ' + preferredDate);
        System.debug('➡️ selectedDetails: ' + selectedDetails);
        System.debug('➡️ description: ' + description);

        DateTime parsedDate;
        try {
            parsedDate = DateTime.valueOf(preferredDate);
        } catch (Exception e) {
            System.debug('❌ preferredDate 변환 실패: ' + e.getMessage());
            throw new AuraHandledException('날짜 형식이 잘못되었습니다.');
        }

        Case newCase = new Case(
            AccountId = accountId,
            Repair_Shop__c = repairShopId,
            Preferred_Date__c = parsedDate,
            ServiceReservationTypeDetails__c = selectedDetails,
            Description = description
        );

        System.debug('🧾 Case 준비 완료: ' + JSON.serialize(newCase));

        try {
            insert newCase;
            System.debug('✅ Case 생성 성공');
        } catch (DmlException e) {
            System.debug('❌ DML 실패: ' + e.getDmlMessage(0));
            System.debug('❗ 전체 오류: ' + e.getMessage());
            throw new AuraHandledException('Case 생성 중 오류 발생: ' + e.getDmlMessage(0));
        }
    }
}