trigger PartsInventoryTrigger on Parts__c (after update) {
    if (Trigger.isAfter && Trigger.isUpdate) {
        PartsInventoryHandler.checkLowStock(Trigger.new, Trigger.oldMap);
    }
}