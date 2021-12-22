public with sharing class InlineEditTableController {
    
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccounts() {
        return [
            SELECT Name, Rating
            FROM Account
            LIMIT 10
        ];
        // try {
            
        // } catch (Exception e) {
        //     throw new AuraHandledException(e.getMessage());
        // }
    }

}