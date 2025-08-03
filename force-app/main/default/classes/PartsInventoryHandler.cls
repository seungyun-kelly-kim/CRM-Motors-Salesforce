/**
 * @description Parts__c 객체의 재고 알림 처리 핸들러
 * @author Claude Code
 * @date 2025-07-29
 */
public with sharing class PartsInventoryHandler {
    
    /**
     * @description 부품 재고가 10% 미만으로 떨어졌을 때 알림 발송
     * @param newParts 업데이트된 부품 레코드 리스트
     * @param oldPartsMap 이전 부품 레코드 맵
     */
    public static void checkLowStock(List<Parts__c> newParts, Map<Id, Parts__c> oldPartsMap) {
        System.debug('🔔 [PartsInventoryHandler] 재고 확인 시작');
        
        List<Parts__c> lowStockParts = new List<Parts__c>();
        
        for (Parts__c newPart : newParts) {
            Parts__c oldPart = oldPartsMap.get(newPart.Id);
            
            // 재고가 변경되었고, 기준 재고가 설정되어 있는 경우만 체크
            if (newPart.Quantity__c != oldPart.Quantity__c && 
                newPart.StandardInventory__c != null && 
                newPart.StandardInventory__c > 0) {
                
                // 현재 재고가 기준 재고의 10% 미만인지 확인
                Decimal lowStockThreshold = newPart.StandardInventory__c * 0.1;
                
                if (newPart.Quantity__c < lowStockThreshold) {
                    System.debug('⚠️ [PartsInventoryHandler] 재고 부족 감지: ' + newPart.Name);
                    System.debug('📊 현재 재고: ' + newPart.Quantity__c + ', 기준 재고: ' + newPart.StandardInventory__c);
                    lowStockParts.add(newPart);
                }
            }
        }
        
        if (!lowStockParts.isEmpty()) {
            sendLowStockNotifications(lowStockParts);
        }
    }
    
    /**
     * @description 재고 부족 알림 발송
     * @param lowStockParts 재고가 부족한 부품 리스트
     */
    private static void sendLowStockNotifications(List<Parts__c> lowStockParts) {
        System.debug('📧 [PartsInventoryHandler] 알림 발송 시작, 대상 부품 수: ' + lowStockParts.size());
        
        try {
            // Custom Notification Type ID 조회 (Setup에서 미리 생성 필요)
            List<CustomNotificationType> notificationTypes = [
                SELECT Id, DeveloperName 
                FROM CustomNotificationType 
                WHERE DeveloperName = 'Parts_Low_Stock_Alert' 
                LIMIT 1
            ];
            
            if (notificationTypes.isEmpty()) {
                System.debug('❌ [PartsInventoryHandler] Custom Notification Type을 찾을 수 없습니다.');
                // Fallback: 이메일 알림으로 대체
                sendEmailNotifications(lowStockParts);
                return;
            }
            
            Id notificationTypeId = notificationTypes[0].Id;
            List<Messaging.CustomNotification> notifications = new List<Messaging.CustomNotification>();
            
            for (Parts__c part : lowStockParts) {
                // 부품 소유자에게 알림 발송
                Messaging.CustomNotification notification = new Messaging.CustomNotification();
                
                String title = '부품 재고 부족 알림';
                String body = String.format(
                    '{0} 부품의 재고가 부족합니다. 현재 재고: {1}개 (기준: {2}개)', 
                    new List<String>{
                        part.Name, 
                        String.valueOf(part.Quantity__c.intValue()), 
                        String.valueOf(part.StandardInventory__c.intValue())
                    }
                );
                
                notification.setTitle(title);
                notification.setBody(body);
                notification.setNotificationTypeId(notificationTypeId);
                notification.setTargetId(part.Id);
                
                try {
                    // alias가 'user17536916065362824897'인 사용자에게 알림 발송
                    List<User> targetUsers = [SELECT Id FROM User WHERE Alias = 'user17536916065362824897' AND IsActive = true LIMIT 1];
                    
                    if (!targetUsers.isEmpty()) {
                        notification.send(new Set<String>{targetUsers[0].Id});
                        System.debug('✅ [PartsInventoryHandler] 알림 발송 성공 (user17536916065362824897 사용자): ' + part.Name);
                    } else {
                        System.debug('⚠️ [PartsInventoryHandler] user17536916065362824897 사용자를 찾을 수 없어 Owner에게 발송: ' + part.Name);
                        notification.send(new Set<String>{part.OwnerId});
                    }
                } catch (Exception e) {
                    System.debug('❌ [PartsInventoryHandler] 알림 발송 실패: ' + part.Name + ', 오류: ' + e.getMessage());
                }
            }
            
        } catch (Exception e) {
            System.debug('❌ [PartsInventoryHandler] 알림 처리 중 오류 발생: ' + e.getMessage());
            // Fallback: 이메일 알림으로 대체
            sendEmailNotifications(lowStockParts);
        }
    }
    
    /**
     * @description 이메일 알림 발송 (Custom Notification 실패 시 대체)
     * @param lowStockParts 재고가 부족한 부품 리스트
     */
    private static void sendEmailNotifications(List<Parts__c> lowStockParts) {
        System.debug('📧 [PartsInventoryHandler] 이메일 알림 발송 시작');
        
        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
        
        for (Parts__c part : lowStockParts) {
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            
            String subject = '[긴급] 부품 재고 부족 알림 - ' + part.Name;
            String htmlBody = String.format(
                '<h2>부품 재고 부족 알림</h2>' +
                '<p><strong>부품명:</strong> {0}</p>' +
                '<p><strong>현재 재고:</strong> {1}개</p>' +
                '<p><strong>기준 재고:</strong> {2}개</p>' +
                '<p><strong>재고율:</strong> {3}%</p>' +
                '<p>부품 보충이 필요합니다.</p>',
                new List<String>{
                    part.Name,
                    String.valueOf(part.Quantity__c.intValue()),
                    String.valueOf(part.StandardInventory__c.intValue()),
                    String.valueOf(((part.Quantity__c / part.StandardInventory__c) * 100).setScale(1))
                }
            );
            
            email.setSubject(subject);
            email.setHtmlBody(htmlBody);
            
            // alias가 'user17536916065362824897'인 사용자에게 이메일 발송
            List<User> targetUsers = [SELECT Id FROM User WHERE Alias = 'user17536916065362824897' AND IsActive = true LIMIT 1];
            if (!targetUsers.isEmpty()) {
                email.setTargetObjectId(targetUsers[0].Id);
            } else {
                email.setTargetObjectId(part.OwnerId); // Fallback to owner
            }
            email.setSaveAsActivity(false);
            
            emails.add(email);
        }
        
        if (!emails.isEmpty()) {
            try {
                Messaging.sendEmail(emails);
                System.debug('✅ [PartsInventoryHandler] 이메일 발송 완료: ' + emails.size() + '건');
            } catch (Exception e) {
                System.debug('❌ [PartsInventoryHandler] 이메일 발송 실패: ' + e.getMessage());
            }
        }
    }
}