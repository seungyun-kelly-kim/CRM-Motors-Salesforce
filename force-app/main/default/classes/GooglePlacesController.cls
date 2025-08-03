public with sharing class GooglePlacesController {
    
    private static final String NAMED_CREDENTIAL = 'callout:Google_Maps_API';
    private static final String PLACES_AUTOCOMPLETE_URL = NAMED_CREDENTIAL + '/maps/api/place/autocomplete/json';
    private static final String PLACE_DETAILS_URL = NAMED_CREDENTIAL + '/maps/api/place/details/json';
    
    @AuraEnabled(cacheable=true)
    public static String getPlaceSuggestions(String input) {
        try {
            if (String.isBlank(input) || input.length() < 2) {
                return '{"predictions": []}';
            }
            
            String encodedInput = EncodingUtil.urlEncode(input, 'UTF-8');
            String endpoint = PLACES_AUTOCOMPLETE_URL + 
                             '?input=' + encodedInput + 
                             '&language=ko' +
                             '&components=country:kr' +
                             '&key={!$Credential.Google_Maps_API.Password}';
            
            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('GET');
            req.setTimeout(10000);
            
            Http http = new Http();
            HttpResponse res = http.send(req);
            
            if (res.getStatusCode() == 200) {
                return res.getBody();
            } else {
                System.debug('Google Places API 오류: ' + res.getStatusCode() + ' - ' + res.getBody());
                throw new AuraHandledException('주소 검색 서비스에 오류가 발생했습니다.');
            }
            
        } catch (Exception e) {
            System.debug('getPlaceSuggestions 예외: ' + e.getMessage());
            throw new AuraHandledException('주소 검색 중 오류가 발생했습니다: ' + e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static String getPlaceDetails(String placeId) {
        try {
            if (String.isBlank(placeId)) {
                throw new AuraHandledException('Place ID가 필요합니다.');
            }
            
            String endpoint = PLACE_DETAILS_URL + 
                             '?place_id=' + placeId + 
                             '&language=ko' +
                             '&fields=name,formatted_address,geometry,address_components' +
                             '&key={!$Credential.Google_Maps_API.Password}';
            
            HttpRequest req = new HttpRequest();
            req.setEndpoint(endpoint);
            req.setMethod('GET');
            req.setTimeout(10000);
            
            Http http = new Http();
            HttpResponse res = http.send(req);
            
            if (res.getStatusCode() == 200) {
                return res.getBody();
            } else {
                System.debug('Google Place Details API 오류: ' + res.getStatusCode() + ' - ' + res.getBody());
                throw new AuraHandledException('주소 상세 정보 조회에 오류가 발생했습니다.');
            }
            
        } catch (Exception e) {
            System.debug('getPlaceDetails 예외: ' + e.getMessage());
            throw new AuraHandledException('주소 상세 정보 조회 중 오류가 발생했습니다: ' + e.getMessage());
        }
    }
}