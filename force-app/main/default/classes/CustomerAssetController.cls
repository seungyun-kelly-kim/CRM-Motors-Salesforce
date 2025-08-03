public with sharing class CustomerAssetController {
    @AuraEnabled(cacheable=true)
    public static List<AssetWithWarranty> getAssetsByAccount(Id accountId) {
        try {
            System.debug('Searching assets for Account ID: ' + accountId);
            
            List<Asset> assets = [
                SELECT Id, Name, RangeKm__c, Asset_Related_VIN__c, Year__c
                FROM Asset
                WHERE AccountId = :accountId
            ];
            
            System.debug('Found ' + assets.size() + ' assets for Account ID: ' + accountId);
        
        List<AssetWithWarranty> result = new List<AssetWithWarranty>();
        
        for (Asset asset : assets) {
            AssetWithWarranty assetWithWarranty = new AssetWithWarranty();
            assetWithWarranty.assetInfo = asset;
            
            // 해당 Asset과 연관된 보증 정보 조회
            List<Warranty__c> warranties = [
                SELECT Id, Expiration_Date__c
                FROM Warranty__c
                WHERE Warranty_Related_Asset__c = :asset.Id
                ORDER BY Expiration_Date__c DESC
                LIMIT 1
            ];
            
            if (!warranties.isEmpty()) {
                assetWithWarranty.warrantyExpirationDate = warranties[0].Expiration_Date__c;
                assetWithWarranty.isWarrantyValid = warranties[0].Expiration_Date__c >= Date.today();
            } else {
                assetWithWarranty.warrantyExpirationDate = null;
                assetWithWarranty.isWarrantyValid = false;
            }
            
            result.add(assetWithWarranty);
        }
        
        return result;
        } catch (Exception e) {
            System.debug('Error in getAssetsByAccount: ' + e.getMessage());
            throw new AuraHandledException('Asset 조회 오류: ' + e.getMessage());
        }
    }
    
    public class AssetWithWarranty {
        @AuraEnabled public Asset assetInfo { get; set; }
        @AuraEnabled public Date warrantyExpirationDate { get; set; }
        @AuraEnabled public Boolean isWarrantyValid { get; set; }
    }
}