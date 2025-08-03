public with sharing class PartsController {
    
    // 부품 정보를 담는 래퍼 클래스
    public class PartWrapper {
        @AuraEnabled public Id Id;
        @AuraEnabled public String Name;
        @AuraEnabled public Decimal Price;
        @AuraEnabled public String PartsClassification;
        @AuraEnabled public Decimal Quantity;
        @AuraEnabled public Decimal InvertoryRate;
        @AuraEnabled public String ImageURL;
        
        public PartWrapper(Id id, String name, Decimal price, String partsClassification, 
                          Decimal quantity, Decimal invertoryRate, String imageURL) {
            this.Id = id;
            this.Name = name;
            this.Price = price;
            this.PartsClassification = partsClassification;
            this.Quantity = quantity;
            this.InvertoryRate = invertoryRate;
            this.ImageURL = imageURL;
        }
    }
    
    /**
     * 모든 부품 정보를 재고율 낮은 순서로 조회합니다.
     * @return 부품 정보 리스트 (재고율 낮은 순서)
     */
    @AuraEnabled(cacheable=true)
    public static List<PartWrapper> getVehicleParts() {
        List<PartWrapper> results = new List<PartWrapper>();
        
        try {
            // 모든 부품 조회 (검색 기능을 위해)
            List<Parts__c> parts = [
                SELECT Id, Name, Quantity__c, Price__c, PartsClassification__c, InvertoryRate__c, imageURL__c
                FROM Parts__c 
                ORDER BY InvertoryRate__c ASC NULLS LAST
            ];
            
            for (Parts__c part : parts) {
                results.add(new PartWrapper(
                    part.Id,
                    part.Name,
                    part.Price__c != null ? part.Price__c : 0,
                    part.PartsClassification__c != null ? part.PartsClassification__c : 'Unknown',
                    part.Quantity__c != null ? part.Quantity__c : 0,
                    part.InvertoryRate__c != null ? part.InvertoryRate__c : 0,
                    part.imageURL__c
                ));
            }
            
            System.debug('🔍 [PartsController] 조회된 부품 수: ' + results.size());
            
        } catch (Exception e) {
            System.debug('❌ [PartsController] 오류: ' + e.getMessage());
            throw new AuraHandledException('부품 정보를 조회하는 중 오류가 발생했습니다: ' + e.getMessage());
        }
        
        return results;
    }
    
    /**
     * 특정 부품의 상세 정보를 조회합니다.
     * @param partId 부품 ID
     * @return 부품 상세 정보
     */
    @AuraEnabled(cacheable=true)
    public static PartWrapper getPartDetails(Id partId) {
        try {
            // 실제 구현시에는 커스텀 객체에서 조회
            /*
            Parts__c part = [
                SELECT Id, Name, Price__c, PartsClassification__c, Quantity__c, InvertoryRate__c, imageURL__c
                FROM Parts__c 
                WHERE Id = :partId
                LIMIT 1
            ];
            
            return new PartWrapper(
                part.Id,
                part.Name,
                part.Price__c,
                part.PartsClassification__c,
                part.Quantity__c,
                part.InvertoryRate__c,
                part.imageURL__c
            );
            */
            
            // 샘플 데이터
            return new PartWrapper(
                partId,
                '샘플 부품',
                100000,
                'EngineMotor',
                50,
                80.0,
                null
            );
            
        } catch (Exception e) {
            System.debug('❌ [PartsController] 부품 상세 조회 오류: ' + e.getMessage());
            throw new AuraHandledException('부품 상세 정보를 조회하는 중 오류가 발생했습니다: ' + e.getMessage());
        }
    }
    
    /**
     * 부품 재고를 업데이트합니다.
     * @param partId 부품 ID
     * @param newQuantity 새로운 재고 수량
     * @return 업데이트 성공 여부
     */
    @AuraEnabled
    public static Boolean updatePartStock(Id partId, Integer newQuantity) {
        try {
            // 실제 구현시에는 커스텀 객체 업데이트
            /*
            Parts__c part = [SELECT Id, Quantity__c FROM Parts__c WHERE Id = :partId LIMIT 1];
            part.Quantity__c = newQuantity;
            update part;
            */
            
            System.debug('🔄 [PartsController] 부품 재고 업데이트: ' + partId + ' -> ' + newQuantity);
            return true;
            
        } catch (Exception e) {
            System.debug('❌ [PartsController] 재고 업데이트 오류: ' + e.getMessage());
            throw new AuraHandledException('부품 재고를 업데이트하는 중 오류가 발생했습니다: ' + e.getMessage());
        }
    }
}