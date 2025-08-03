public with sharing class RepairSelectorController {
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getInspectionTypePicklistValues() {
        List<Map<String, String>> options = new List<Map<String, String>>();
        
        Schema.DescribeFieldResult fieldResult = Case.Service_Type__c.getDescribe();
        List<Schema.PicklistEntry> picklistEntries = fieldResult.getPicklistValues();
        
        for (Schema.PicklistEntry entry : picklistEntries) {
            if (entry.isActive()) {
                Map<String, String> option = new Map<String, String>();
                option.put('label', entry.getLabel());
                option.put('value', entry.getValue());
                options.add(option);
            }
        }
        
        return options;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getServiceTypePicklistValues() {
        List<Map<String, String>> options = new List<Map<String, String>>();
        
        Schema.DescribeFieldResult fieldResult = Case.ServiceReservationType__c.getDescribe();
        List<Schema.PicklistEntry> picklistEntries = fieldResult.getPicklistValues();
        
        for (Schema.PicklistEntry entry : picklistEntries) {
            if (entry.isActive()) {
                Map<String, String> option = new Map<String, String>();
                option.put('label', entry.getLabel());
                option.put('value', entry.getValue());
                options.add(option);
            }
        }
        
        return options;
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getServiceDetailPicklistValues() {
        List<Map<String, String>> options = new List<Map<String, String>>();
        
        Schema.DescribeFieldResult fieldResult = Case.ServiceReservationTypeDetails__c.getDescribe();
        List<Schema.PicklistEntry> picklistEntries = fieldResult.getPicklistValues();
        
        for (Schema.PicklistEntry entry : picklistEntries) {
            if (entry.isActive()) {
                Map<String, String> option = new Map<String, String>();
                option.put('label', entry.getLabel());
                option.put('value', entry.getValue());
                options.add(option);
            }
        }
        
        return options;
    }
    
    @AuraEnabled
    public static List<Map<String, String>> getDependentPicklistValues(String controllingValue) {
        List<Map<String, String>> options = new List<Map<String, String>>();
        
        if (String.isBlank(controllingValue)) {
            return options;
        }
        
        try {
            System.debug('Getting dependent values for: ' + controllingValue);
            
            Schema.DescribeFieldResult dependentFieldResult = Case.ServiceReservationTypeDetails__c.getDescribe();
            List<Schema.PicklistEntry> dependentEntries = dependentFieldResult.getPicklistValues();
            
            for (Schema.PicklistEntry entry : dependentEntries) {
                if (entry.isActive()) {
                    String dependentValue = entry.getValue();
                    System.debug('Testing dependency: ' + controllingValue + ' -> ' + dependentValue);
                    
                    if (testDependencyWithValidation(controllingValue, dependentValue)) {
                        Map<String, String> option = new Map<String, String>();
                        option.put('label', entry.getLabel());
                        option.put('value', entry.getValue());
                        options.add(option);
                        System.debug('Valid dependency: ' + entry.getLabel());
                    } else {
                        System.debug('Invalid dependency: ' + entry.getLabel());
                    }
                }
            }
            
        } catch (Exception e) {
            System.debug('Error in getDependentPicklistValues: ' + e.getMessage());
            System.debug('Stack trace: ' + e.getStackTraceString());
        }
        
        System.debug('Total valid options: ' + options.size());
        return options;
    }
    
    private static Boolean testDependencyWithValidation(String controllingValue, String dependentValue) {
        try {
            Case testCase = new Case(
                Subject = 'Test Dependency',
                Status = 'New',
                Origin = 'Web',
                ServiceReservationType__c = controllingValue,
                ServiceReservationTypeDetails__c = dependentValue
            );
            
            Savepoint sp = Database.setSavepoint();
            
            try {
                insert testCase;
                Database.rollback(sp);
                return true;
                
            } catch (DmlException dmlEx) {
                Database.rollback(sp);
                
                String errorMessage = dmlEx.getMessage().toLowerCase();
                
                if (errorMessage.contains('invalid') || 
                    errorMessage.contains('dependent') || 
                    errorMessage.contains('controlling') ||
                    errorMessage.contains('picklist')) {
                    System.debug('Dependency validation failed: ' + dmlEx.getMessage());
                    return false;
                } else {
                    return true;
                }
            }
            
        } catch (Exception ex) {
            System.debug('Unexpected error in testDependencyWithValidation: ' + ex.getMessage());
            return true;
        }
    }
    
    @AuraEnabled
    public static Map<String, Object> debugActualDependencies() {
        Map<String, Object> result = new Map<String, Object>();
        
        try {
            Schema.DescribeFieldResult controllingField = Case.ServiceReservationType__c.getDescribe();
            List<Schema.PicklistEntry> controllingEntries = controllingField.getPicklistValues();
            
            Schema.DescribeFieldResult dependentField = Case.ServiceReservationTypeDetails__c.getDescribe();
            List<Schema.PicklistEntry> dependentEntries = dependentField.getPicklistValues();
            
            Map<String, List<String>> actualDependencies = new Map<String, List<String>>();
            
            for (Schema.PicklistEntry controllingEntry : controllingEntries) {
                if (controllingEntry.isActive()) {
                    String controllingValue = controllingEntry.getValue();
                    List<String> validDependentValues = new List<String>();
                    
                    for (Schema.PicklistEntry dependentEntry : dependentEntries) {
                        if (dependentEntry.isActive()) {
                            if (testDependencyWithValidation(controllingValue, dependentEntry.getValue())) {
                                validDependentValues.add(dependentEntry.getLabel() + ' (' + dependentEntry.getValue() + ')');
                            }
                        }
                    }
                    
                    actualDependencies.put(controllingEntry.getLabel() + ' (' + controllingValue + ')', validDependentValues);
                }
            }
            
            result.put('dependencies', actualDependencies);
            result.put('success', true);
            
        } catch (Exception e) {
            result.put('error', e.getMessage());
            result.put('success', false);
        }
        
        return result;
    }
}