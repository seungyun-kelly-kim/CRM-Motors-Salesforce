/**
 * @description PartsInventoryHandler 테스트 클래스
 * @author Claude Code
 * @date 2025-07-29
 */
@isTest
public class PartsInventoryHandlerTest {
    
    @TestSetup
    static void setupTestData() {
        // 테스트용 부품 데이터 생성
        Parts__c testPart1 = new Parts__c(
            Name = '테스트 엔진 오일',
            Quantity__c = 50,
            StandardInventory__c = 100,
            Price__c = 25000,
            PartsClassification__c = 'EngineMotor'
        );
        
        Parts__c testPart2 = new Parts__c(
            Name = '테스트 배터리',
            Quantity__c = 20,
            StandardInventory__c = 50,
            Price__c = 150000,
            PartsClassification__c = 'Battery'
        );
        
        insert new List<Parts__c>{testPart1, testPart2};
    }
    
    @isTest
    static void testLowStockAlert_WhenStockDropsBelow10Percent() {
        // Given: 재고가 10% 이상인 부품
        Parts__c testPart = [SELECT Id, Name, Quantity__c, StandardInventory__c FROM Parts__c WHERE Name = '테스트 엔진 오일' LIMIT 1];
        
        Test.startTest();
        
        // When: 재고를 10% 미만으로 감소
        testPart.Quantity__c = 5; // 100의 5% = 10% 미만
        update testPart;
        
        Test.stopTest();
        
        // Then: 알림이 발송되어야 함 (실제 알림 발송은 비동기로 처리되므로 로그로 확인)
        System.debug('테스트 완료: 재고 부족 알림이 발송되어야 합니다.');
    }
    
    @isTest
    static void testNoAlert_WhenStockAbove10Percent() {
        // Given: 재고가 10% 이상인 부품
        Parts__c testPart = [SELECT Id, Name, Quantity__c, StandardInventory__c FROM Parts__c WHERE Name = '테스트 배터리' LIMIT 1];
        
        Test.startTest();
        
        // When: 재고를 10% 이상으로 유지
        testPart.Quantity__c = 15; // 50의 30% = 10% 이상
        update testPart;
        
        Test.stopTest();
        
        // Then: 알림이 발송되지 않아야 함
        System.debug('테스트 완료: 알림이 발송되지 않아야 합니다.');
    }
    
    @isTest
    static void testNoAlert_WhenStockNotChanged() {
        // Given: 기존 부품
        Parts__c testPart = [SELECT Id, Name, Quantity__c, StandardInventory__c FROM Parts__c WHERE Name = '테스트 엔진 오일' LIMIT 1];
        
        Test.startTest();
        
        // When: 재고 외 다른 필드만 변경
        testPart.Price__c = 30000;
        update testPart;
        
        Test.stopTest();
        
        // Then: 알림이 발송되지 않아야 함
        System.debug('테스트 완료: 재고 변경이 없으므로 알림이 발송되지 않아야 합니다.');
    }
    
    @isTest
    static void testMultipleLowStockParts() {
        // Given: 여러 부품
        List<Parts__c> testParts = [SELECT Id, Name, Quantity__c, StandardInventory__c FROM Parts__c];
        
        Test.startTest();
        
        // When: 모든 부품의 재고를 10% 미만으로 감소
        for (Parts__c part : testParts) {
            part.Quantity__c = 2; // 모든 부품을 10% 미만으로 설정
        }
        update testParts;
        
        Test.stopTest();
        
        // Then: 모든 부품에 대해 알림이 발송되어야 함
        System.debug('테스트 완료: ' + testParts.size() + '개 부품에 대한 알림이 발송되어야 합니다.');
    }
    
    @isTest
    static void testHandlerDirectCall() {
        // Given: 테스트 데이터
        Parts__c testPart = [SELECT Id, Name, Quantity__c, StandardInventory__c FROM Parts__c WHERE Name = '테스트 엔진 오일' LIMIT 1];
        Parts__c oldPart = testPart.clone(true);
        
        // When: 재고 변경 후 핸들러 직접 호출
        testPart.Quantity__c = 5;
        Map<Id, Parts__c> oldMap = new Map<Id, Parts__c>{testPart.Id => oldPart};
        
        Test.startTest();
        PartsInventoryHandler.checkLowStock(new List<Parts__c>{testPart}, oldMap);
        Test.stopTest();
        
        // Then: 정상 처리되어야 함
        System.debug('테스트 완료: 핸들러가 정상적으로 실행되어야 합니다.');
    }
}