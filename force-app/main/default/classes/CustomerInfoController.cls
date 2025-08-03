public without sharing class CustomerInfoController {
  @AuraEnabled(cacheable=true)
  public static Account getCustomerInfo() {
    String accountId = '001gL00000FZECnQAP';

    List<Account> accounts = [
      SELECT Id, Name, Phone, PersonEmail
      FROM Account
      WHERE Id = :accountId
      LIMIT 1
    ];

    if (!accounts.isEmpty()) {
      return accounts[0];
    }

    return null;
  }
}
