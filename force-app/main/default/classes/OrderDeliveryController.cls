public with sharing class OrderDeliveryController {
    
    @AuraEnabled(cacheable=false)
    public static Order getOrderDeliveryStatus(String orderId) {
        if (String.isBlank(orderId)) {
            throw new AuraHandledException('주문 ID가 필요합니다.');
        }
        
        try {
            List<Order> orders = [
                SELECT Id, 
                       OrderNumber, 
                       Name, 
                       TotalAmount, 
                       EffectiveDate, 
                       Status, 
                       Delivery_Status__c, 
                       Delivery_Date__c,
                       CreatedDate,
                       LastModifiedDate,
                       Account.Name,
                       BillToContact.Name,
                       ShipToContact.Name
                FROM Order
                WHERE Id = :orderId
                LIMIT 1
            ];
            
            if (orders.isEmpty()) {
                throw new AuraHandledException('주문 ID ' + orderId + '를 찾을 수 없습니다.');
            }
            
            return orders[0];
        } catch (QueryException e) {
            throw new AuraHandledException('주문 정보 조회 중 오류가 발생했습니다: ' + e.getMessage());
        } catch (Exception e) {
            throw new AuraHandledException('예상치 못한 오류가 발생했습니다: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static String updateDeliveryStatus(String orderId, String deliveryStatus) {
        if (String.isBlank(orderId)) {
            throw new AuraHandledException('주문 ID가 필요합니다.');
        }
        
        if (String.isBlank(deliveryStatus)) {
            throw new AuraHandledException('배송 상태가 필요합니다.');
        }
        
        // 유효한 배송 상태인지 확인
        Set<String> validStatuses = new Set<String>{
            'InPreparation', 'Delivering', 'Delivered', 'Cancelled'
        };
        
        if (!validStatuses.contains(deliveryStatus)) {
            throw new AuraHandledException('유효하지 않은 배송 상태입니다: ' + deliveryStatus);
        }
        
        try {
            Order orderToUpdate = [
                SELECT Id, Delivery_Status__c 
                FROM Order 
                WHERE Id = :orderId 
                LIMIT 1
            ];
            
            orderToUpdate.Delivery_Status__c = deliveryStatus;
            
            // 배송 완료 시 배송 날짜 자동 설정
            if (deliveryStatus == 'Delivered' && orderToUpdate.Delivery_Date__c == null) {
                orderToUpdate.Delivery_Date__c = Date.today();
            }
            
            update orderToUpdate;
            
            return '배송 상태가 성공적으로 업데이트되었습니다.';
            
        } catch (DmlException e) {
            throw new AuraHandledException('배송 상태 업데이트 중 오류가 발생했습니다: ' + e.getDmlMessage(0));
        } catch (QueryException e) {
            throw new AuraHandledException('주문을 찾을 수 없습니다: ' + e.getMessage());
        } catch (Exception e) {
            throw new AuraHandledException('예상치 못한 오류가 발생했습니다: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getDeliveryStatusOptions() {
        try {
            List<Map<String, String>> statusOptions = new List<Map<String, String>>();
            
            statusOptions.add(new Map<String, String>{
                'label' => '주문 준비 중',
                'value' => 'InPreparation'
            });
            
            statusOptions.add(new Map<String, String>{
                'label' => '배송중',
                'value' => 'Delivering'
            });
            
            statusOptions.add(new Map<String, String>{
                'label' => '배송 완료',
                'value' => 'Delivered'
            });
            
            statusOptions.add(new Map<String, String>{
                'label' => '주문 취소',
                'value' => 'Cancelled'
            });
            
            return statusOptions;
            
        } catch (Exception e) {
            throw new AuraHandledException('배송 상태 옵션 조회 중 오류가 발생했습니다: ' + e.getMessage());
        }
    }
}