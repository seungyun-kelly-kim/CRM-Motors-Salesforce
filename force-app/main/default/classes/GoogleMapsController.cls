public with sharing class GoogleMapsController {
    
    // Named Credential을 통한 보안 API 호출
    private static final String NAMED_CREDENTIAL = 'callout:Google_Maps_API';
    private static final String PLACE_AUTOCOMPLETE_URL = NAMED_CREDENTIAL + '/maps/api/place/autocomplete/json';
    private static final String PLACE_DETAILS_URL = NAMED_CREDENTIAL + '/maps/api/place/details/json';
    private static final String GEOCODING_URL = NAMED_CREDENTIAL + '/maps/api/geocode/json';
    



    @AuraEnabled(cacheable=false)
    public static String getPlaceSuggestions(String input) {
        try {
            // Named Credential을 통한 안전한 API 호출
            // String url = PLACE_AUTOCOMPLETE_URL + 
            //             '?input=' + EncodingUtil.urlEncode(input, 'UTF-8') + 
            //             '&language=ko' + 
            //             '&components=country:kr';
            
            Http http = new Http();
            // HttpRequest request = new HttpRequest();
            // request.setEndpoint(url);
            // request.setMethod('GET');
            // request.setTimeout(10000);
            

            HttpRequest req = new HttpRequest();
            String endpoint = 'https://maps.googleapis.com/maps/api/place/details/json?place_id=' + EncodingUtil.urlEncode(input, 'UTF-8') + '&language=ko';
        
            // Named Credential을 사용하여 인증 정보 처리
            req.setEndpoint(URL.getOrgDomainUrl().toExternalForm() + '/services/apexrest/' + NAMED_CREDENTIAL + '/places/details?place_id=' + EncodingUtil.urlEncode(input, 'UTF-8'));
            req.setMethod('GET');
            System.debug(':돋보기: Autocomplete 요청 URL: ' + req.getEndpoint());
            HttpResponse response = http.send(req);
            
            if (response.getStatusCode() == 200) {
                return response.getBody();
            } else {
                System.debug('Google Places API Error: ' + response.getStatusCode() + ' - ' + response.getBody());
                // API 호출 실패시 더미 데이터 반환
                return getDummyPlaceSuggestions(input);
            }
            
        } catch (Exception e) {
            System.debug('Exception in getPlaceSuggestions: ' + e.getMessage());
            // 예외 발생시 더미 데이터 반환 (개발/데모 목적)
            return getDummyPlaceSuggestions(input);
        }
    }
    
    @AuraEnabled(cacheable=false)
    public static String getPlaceDetails(String placeId) {
        try {
            // Named Credential을 통한 안전한 API 호출
            String url = PLACE_DETAILS_URL + 
                        '?place_id=' + EncodingUtil.urlEncode(placeId, 'UTF-8') + 
                        '&language=ko' + 
                        '&fields=name,formatted_address,geometry,address_components';
            
            Http http = new Http();
            HttpRequest request = new HttpRequest();
            request.setEndpoint(url);
            request.setMethod('GET');
            request.setTimeout(10000);
            
            HttpResponse response = http.send(request);
            
            if (response.getStatusCode() == 200) {
                return response.getBody();
            } else {
                System.debug('Google Place Details API Error: ' + response.getStatusCode() + ' - ' + response.getBody());
                // API 호출 실패시 더미 데이터 반환
                return getDummyPlaceDetails(placeId);
            }
            
        } catch (Exception e) {
            System.debug('Exception in getPlaceDetails: ' + e.getMessage());
            // 예외 발생시 더미 데이터 반환 (개발/데모 목적)
            return getDummyPlaceDetails(placeId);
        }
    }
    
    // 주소를 위도/경도로 변환하는 Geocoding API 호출
    @AuraEnabled(cacheable=true)
    public static Map<String, Decimal> getCoordinatesFromAddress(String address) {
        System.debug('🌍 Geocoding 시작 - 주소: ' + address);
        
        try {
            String url = GEOCODING_URL + 
                        '?address=' + EncodingUtil.urlEncode(address, 'UTF-8') + 
                        '&language=ko' + 
                        '&region=kr';
            
            System.debug('🔗 API URL: ' + url);
            
            Http http = new Http();
            HttpRequest request = new HttpRequest();
            request.setEndpoint(url);
            request.setMethod('GET');
            request.setTimeout(10000);
            
            HttpResponse response = http.send(request);
            System.debug('📡 API 응답 상태: ' + response.getStatusCode());
            System.debug('📡 API 응답 본문: ' + response.getBody());
            System.debug('🔗 호출한 URL: ' + url);
            
            if (response.getStatusCode() == 200) {
                Map<String, Object> responseData = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
                String status = (String) responseData.get('status');
                System.debug('🔍 Google API Status: ' + status);
                
                if (status == 'OK') {
                    List<Object> results = (List<Object>) responseData.get('results');
                    
                    if (!results.isEmpty()) {
                        Map<String, Object> firstResult = (Map<String, Object>) results[0];
                        Map<String, Object> geometry = (Map<String, Object>) firstResult.get('geometry');
                        Map<String, Object> location = (Map<String, Object>) geometry.get('location');
                        
                        Decimal lat = (Decimal) location.get('lat');
                        Decimal lng = (Decimal) location.get('lng');
                        
                        System.debug('✅ 좌표 조회 성공 - Lat: ' + lat + ', Lng: ' + lng);
                        
                        return new Map<String, Decimal>{
                            'latitude' => lat,
                            'longitude' => lng
                        };
                    } else {
                        System.debug('❌ Google API 결과 없음');
                    }
                } else {
                    System.debug('❌ Google API Status 오류: ' + status);
                    if (responseData.containsKey('error_message')) {
                        System.debug('❌ Error Message: ' + responseData.get('error_message'));
                    }
                }
            } else {
                System.debug('❌ HTTP 오류: ' + response.getStatusCode() + ' - ' + response.getBody());
            }
            
        } catch (Exception e) {
            System.debug('❌ Exception in getCoordinatesFromAddress: ' + e.getMessage());
            System.debug('❌ Stack Trace: ' + e.getStackTraceString());
        }
        
        System.debug('❌ Google API 실패 - 좌표 조회 불가');
        // Google API 실패시 null 반환 (하드코딩 백업 제거)
        return null;
    }
    
    
    // 정비소 레코드의 위도/경도를 업데이트하는 메서드
    @AuraEnabled
    public static void updateRepairShopCoordinates(Id repairShopId, String address) {
        try {
            System.debug('🔄 좌표 업데이트 시작 - ID: ' + repairShopId + ', 주소: ' + address);
            
            // 입력 검증
            if (String.isBlank(repairShopId) || String.isBlank(address)) {
                throw new AuraHandledException('정비소 ID와 주소는 필수 항목입니다.');
            }
            
            // 정비소 존재 여부 확인
            List<Repair_Shop__c> existingShops = [
                SELECT Id, Name FROM Repair_Shop__c WHERE Id = :repairShopId LIMIT 1
            ];
            
            if (existingShops.isEmpty()) {
                throw new AuraHandledException('해당 정비소를 찾을 수 없습니다: ' + repairShopId);
            }
            
            Map<String, Decimal> coordinates = getCoordinatesFromAddress(address);
            
            if (coordinates != null && coordinates.containsKey('latitude') && coordinates.containsKey('longitude')) {
                // 필드 존재 여부 확인
                Map<String, Schema.SObjectField> fieldMap = Schema.SObjectType.Repair_Shop__c.fields.getMap();
                
                if (!fieldMap.containsKey('Latitude__c') || !fieldMap.containsKey('Longitude__c')) {
                    throw new AuraHandledException('Repair_Shop__c 객체에 Latitude__c 또는 Longitude__c 필드가 없습니다. Setup에서 필드를 생성해주세요.');
                }
                
                Repair_Shop__c shop = new Repair_Shop__c(
                    Id = repairShopId
                );
                
                // 동적으로 필드값 설정
                shop.put('Latitude__c', coordinates.get('latitude'));
                shop.put('Longitude__c', coordinates.get('longitude'));
                
                update shop;
                System.debug('✅ 정비소 좌표 업데이트 완료: ' + existingShops[0].Name + 
                           ' (Lat: ' + coordinates.get('latitude') + 
                           ', Lng: ' + coordinates.get('longitude') + ')');
            } else {
                System.debug('❌ 좌표 조회 실패 - 주소: ' + address);
                throw new AuraHandledException('주소에서 좌표를 찾을 수 없습니다: ' + address);
            }
            
        } catch (DmlException e) {
            System.debug('❌ DML 오류: ' + e.getMessage());
            throw new AuraHandledException('데이터베이스 업데이트 중 오류: ' + e.getDmlMessage(0));
        } catch (Exception e) {
            System.debug('❌ 일반 오류: ' + e.getMessage());
            System.debug('❌ 스택 트레이스: ' + e.getStackTraceString());
            throw new AuraHandledException('좌표 업데이트 중 오류가 발생했습니다: ' + e.getMessage());
        }
    }
    
    // 개발/테스트용 더미 데이터 (API 호출 실패시 사용)
    private static String getDummyPlaceSuggestions(String input) {
        Map<String, Object> response = new Map<String, Object>();
        List<Map<String, Object>> predictions = new List<Map<String, Object>>();
        
        // 서울 지역 더미 데이터
        if (input.contains('서울') || input.contains('강남') || input.contains('Seoul')) {
            predictions.add(new Map<String, Object>{
                'place_id' => 'dummy_gangnam_1',
                'description' => '서울특별시 강남구 테헤란로 123',
                'structured_formatting' => new Map<String, Object>{
                    'main_text' => '테헤란로 123',
                    'secondary_text' => '강남구, 서울특별시'
                }
            });
            predictions.add(new Map<String, Object>{
                'place_id' => 'dummy_gangnam_2',
                'description' => '서울특별시 강남구 역삼동 456',
                'structured_formatting' => new Map<String, Object>{
                    'main_text' => '역삼동 456',
                    'secondary_text' => '강남구, 서울특별시'
                }
            });
        } else if (input.contains('부산') || input.contains('Busan')) {
            predictions.add(new Map<String, Object>{
                'place_id' => 'dummy_busan_1',
                'description' => '부산광역시 해운대구 해운대로 789',
                'structured_formatting' => new Map<String, Object>{
                    'main_text' => '해운대로 789',
                    'secondary_text' => '해운대구, 부산광역시'
                }
            });
        } else {
            // 기본 더미 데이터
            predictions.add(new Map<String, Object>{
                'place_id' => 'dummy_default_1',
                'description' => input + ' 관련 주소 1',
                'structured_formatting' => new Map<String, Object>{
                    'main_text' => input + ' 관련 장소',
                    'secondary_text' => '서울특별시'
                }
            });
        }
        
        response.put('predictions', predictions);
        response.put('status', 'OK');
        
        return JSON.serialize(response);
    }
    
    private static String getDummyPlaceDetails(String placeId) {
        Map<String, Object> response = new Map<String, Object>();
        Map<String, Object> result = new Map<String, Object>();
        
        // placeId에 따른 더미 상세 정보
        if (placeId == 'dummy_gangnam_1') {
            result.put('name', '테스트 정비소 강남점');
            result.put('formatted_address', '서울특별시 강남구 테헤란로 123');
            result.put('geometry', new Map<String, Object>{
                'location' => new Map<String, Object>{
                    'lat' => 37.5012767,
                    'lng' => 127.0396597
                }
            });
            result.put('address_components', new List<Map<String, Object>>{
                new Map<String, Object>{
                    'long_name' => '123',
                    'short_name' => '123',
                    'types' => new List<String>{'street_number'}
                },
                new Map<String, Object>{
                    'long_name' => '테헤란로',
                    'short_name' => '테헤란로',
                    'types' => new List<String>{'route'}
                },
                new Map<String, Object>{
                    'long_name' => '강남구',
                    'short_name' => '강남구',
                    'types' => new List<String>{'sublocality_level_1', 'sublocality', 'political'}
                },
                new Map<String, Object>{
                    'long_name' => '서울특별시',
                    'short_name' => '서울',
                    'types' => new List<String>{'administrative_area_level_1', 'political'}
                },
                new Map<String, Object>{
                    'long_name' => '대한민국',
                    'short_name' => 'KR',
                    'types' => new List<String>{'country', 'political'}
                },
                new Map<String, Object>{
                    'long_name' => '06234',
                    'short_name' => '06234',
                    'types' => new List<String>{'postal_code'}
                }
            });
        } else if (placeId == 'dummy_busan_1') {
            result.put('name', '테스트 정비소 해운대점');
            result.put('formatted_address', '부산광역시 해운대구 해운대로 789');
            result.put('geometry', new Map<String, Object>{
                'location' => new Map<String, Object>{
                    'lat' => 35.1595454,
                    'lng' => 129.1625941
                }
            });
            result.put('address_components', new List<Map<String, Object>>{
                new Map<String, Object>{
                    'long_name' => '789',
                    'short_name' => '789',
                    'types' => new List<String>{'street_number'}
                },
                new Map<String, Object>{
                    'long_name' => '해운대로',
                    'short_name' => '해운대로',
                    'types' => new List<String>{'route'}
                },
                new Map<String, Object>{
                    'long_name' => '해운대구',
                    'short_name' => '해운대구',
                    'types' => new List<String>{'sublocality_level_1', 'sublocality', 'political'}
                },
                new Map<String, Object>{
                    'long_name' => '부산광역시',
                    'short_name' => '부산',
                    'types' => new List<String>{'administrative_area_level_1', 'political'}
                },
                new Map<String, Object>{
                    'long_name' => '대한민국',
                    'short_name' => 'KR',
                    'types' => new List<String>{'country', 'political'}
                },
                new Map<String, Object>{
                    'long_name' => '48094',
                    'short_name' => '48094',
                    'types' => new List<String>{'postal_code'}
                }
            });
        } else {
            // 기본 더미 데이터
            result.put('name', '테스트 정비소');
            result.put('formatted_address', '서울특별시 강남구 테헤란로 123');
            result.put('geometry', new Map<String, Object>{
                'location' => new Map<String, Object>{
                    'lat' => 37.5665,
                    'lng' => 126.9780
                }
            });
            result.put('address_components', new List<Map<String, Object>>{
                new Map<String, Object>{
                    'long_name' => '서울특별시',
                    'short_name' => '서울',
                    'types' => new List<String>{'administrative_area_level_1', 'political'}
                },
                new Map<String, Object>{
                    'long_name' => '대한민국',
                    'short_name' => 'KR',
                    'types' => new List<String>{'country', 'political'}
                }
            });
        }
        
        response.put('result', result);
        response.put('status', 'OK');
        
        return JSON.serialize(response);
    }
}