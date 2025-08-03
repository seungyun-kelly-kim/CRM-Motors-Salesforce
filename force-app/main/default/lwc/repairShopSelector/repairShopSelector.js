import { LightningElement, track } from 'lwc';
import getRepairShops from '@salesforce/apex/RepairShopController.getRepairShops';
import getCoordinatesFromAddress from '@salesforce/apex/GoogleMapsController.getCoordinatesFromAddress';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class RepairShopSelector extends LightningElement {
    @track selectedProvince = '';
    @track selectedCity = '';
    @track repairShops = [];
    @track selectedRepairShopId = null;
    @track searchPerformed = false;
    @track mapMarkers = [];
    @track mapCenter = { location: { Latitude: 37.5665, Longitude: 126.9780 } }; // 서울 기본 위치
    @track zoomLevel = 14;

    get isSearchDisabled() {
        return !(this.selectedProvince && this.selectedCity);
    }

    get hasRepairShops() {
        return this.repairShops.length > 0;
    }

    get showNoResults() {
        return this.searchPerformed && this.repairShops.length === 0;
    }

    get isNextDisabled() {
        return !this.selectedRepairShopId;
    }

    handleProvinceChange(event) {
        this.selectedProvince = event.target.value;
        this.selectedCity = '';
        this.repairShops = [];
        this.searchPerformed = false;
    }

    handleCityChange(event) {
        this.selectedCity = event.target.value;
        // 시/군/구 선택하면 바로 검색 실행
        if (this.selectedCity && this.selectedProvince) {
            this.handleSearch();
        }
    }

    async handleSearch() {
        try {
            const data = await getRepairShops({
                province: this.selectedProvince,
                city: this.selectedCity
            });

            this.repairShops = data.map(shop => ({
                ...shop,
                isSelected: false,
                cssClass: 'repair-shop'
            }));
            this.selectedRepairShopId = null;
            this.searchPerformed = true;
            
            // Lightning Map용 마커와 중심점 설정
            this.updateMapMarkers();
            this.updateMapCenter();
            
            // 검색시에는 기본 줌 레벨로 설정
            this.zoomLevel = 14;
            
            // 백엔드에서 자동으로 좌표 업데이트 처리됨
        } catch (error) {
            console.error('Error searching repair shops:', error);
            this.repairShops = [];
            this.searchPerformed = true;
            this.mapMarkers = [];
        }
    }

    updateMapMarkers() {
        // 정비소 정보를 Lightning Map 마커 형식으로 변환
        this.mapMarkers = this.repairShops
            .filter(shop => shop.Latitude__c && shop.Longitude__c) // 좌표가 있는 것만 필터링
            .map(shop => ({
                location: {
                    Latitude: shop.Latitude__c,
                    Longitude: shop.Longitude__c
                },
                title: shop.Name,
                description: `${shop.Address__c}\n${shop.Phone_Number__c || ''}`,
                icon: 'utility:location'
            }));
        
        console.log('🗺️ 지도 마커 업데이트:', this.mapMarkers.length + '개');
    }
    
    updateMapMarkersWithSelection(selectedShopId) {
        try {
            // 선택된 정비소를 다른 아이콘으로 표시
            const validShops = this.repairShops.filter(shop => 
                shop.Latitude__c && 
                shop.Longitude__c && 
                !isNaN(parseFloat(shop.Latitude__c)) && 
                !isNaN(parseFloat(shop.Longitude__c))
            );
            
            this.mapMarkers = validShops.map(shop => {
                const isSelected = shop.Id === selectedShopId;
                return {
                    location: {
                        Latitude: parseFloat(shop.Latitude__c),
                        Longitude: parseFloat(shop.Longitude__c)
                    },
                    title: shop.Name + (isSelected ? ' ✓ 선택됨' : ''),
                    description: `${shop.Address__c || '주소 정보 없음'}\n${shop.Phone_Number__c || '전화번호 정보 없음'}\n${isSelected ? '✅ 선택된 정비소' : '📍 정비소'}`,
                    icon: isSelected ? 'utility:success' : 'utility:location'
                };
            });
            
            console.log('🎯 마커 업데이트 완료 - 총 마커 수:', this.mapMarkers.length, '선택된 정비소 ID:', selectedShopId);
            
        } catch (error) {
            console.error('❌ 마커 업데이트 중 오류:', error);
        }
    }

    updateMapCenter() {
        // 좌표가 있는 첫 번째 정비소를 중심으로 설정
        const shopWithCoords = this.repairShops.find(shop => shop.Latitude__c && shop.Longitude__c);
        
        if (shopWithCoords) {
            this.mapCenter = {
                location: {
                    Latitude: shopWithCoords.Latitude__c,
                    Longitude: shopWithCoords.Longitude__c
                }
            };
        } else {
            // 기본값 설정 (지역별로)
            this.mapCenter = this.getDefaultLocationForRegion(this.selectedProvince, this.selectedCity);
        }
        
        console.log('🗺️ 지도 중심점 업데이트:', this.mapCenter);
    }
    
    getDefaultLocationForRegion(province, city) {
        // 주요 도시별 기본 좌표
        const locationMap = {
            '서울특별시': { Latitude: 37.5665, Longitude: 126.9780 },
            '부산광역시': { Latitude: 35.1796, Longitude: 129.0756 },
            '대구광역시': { Latitude: 35.8714, Longitude: 128.6014 },
            '인천광역시': { Latitude: 37.4563, Longitude: 126.7052 },
            '광주광역시': { Latitude: 35.1595, Longitude: 126.8526 },
            '대전광역시': { Latitude: 36.3504, Longitude: 127.3845 },
            '울산광역시': { Latitude: 35.5384, Longitude: 129.3114 },
            '경기도': { Latitude: 37.4138, Longitude: 127.5183 },
            '강원도': { Latitude: 37.8228, Longitude: 128.1555 },
            '충청북도': { Latitude: 36.8, Longitude: 127.7 },
            '충청남도': { Latitude: 36.5, Longitude: 126.8 },
            '전라북도': { Latitude: 35.7, Longitude: 127.1 },
            '전라남도': { Latitude: 34.8, Longitude: 126.9 },
            '경상북도': { Latitude: 36.4, Longitude: 128.9 },
            '경상남도': { Latitude: 35.4, Longitude: 128.1 },
            '제주특별자치도': { Latitude: 33.4996, Longitude: 126.5312 }
        };
        
        return {
            location: locationMap[province] || { Latitude: 37.5665, Longitude: 126.9780 }
        };
    }

    // 백그라운드 좌표 업데이트 방식으로 변경됨 (위의 메서드들은 더이상 필요 없음)

    handleShopClick(event) {
        // 이벤트 전파 방지
        event.preventDefault();
        event.stopPropagation();
        
        const shopId = event.currentTarget.dataset.id;
        const shop = this.repairShops.find(s => s.Id === shopId);
        
        console.log('🏪 정비소 클릭됨:', shop ? shop.Name : 'Unknown', 'ID:', shopId);
        
        if (!shop) {
            console.error('❌ 정비소를 찾을 수 없습니다. ID:', shopId);
            return;
        }

        // 선택된 정비소 ID 업데이트
        this.selectedRepairShopId = shopId;

        // 모든 정비소의 선택 상태 업데이트 (불변 객체로 처리)
        this.repairShops = this.repairShops.map(s => {
            const isSelected = s.Id === shopId;
            return {
                ...s,
                isSelected: isSelected,
                cssClass: isSelected ? 'repair-shop selected' : 'repair-shop'
            };
        });
        
        console.log('✅ 선택 상태 업데이트 완료. 선택된 정비소:', shop.Name);
        console.log('📍 정비소 좌표 - Lat:', shop.Latitude__c, 'Lng:', shop.Longitude__c);
        
        // 선택 상태 확인을 위한 디버깅
        const selectedShop = this.repairShops.find(s => s.isSelected);
        console.log('🔍 현재 선택된 정비소:', selectedShop ? selectedShop.Name : 'None');
        console.log('🔍 CSS 클래스:', selectedShop ? selectedShop.cssClass : 'N/A');
        
        // 지도 중심점 이동 및 마커 업데이트
        if (shop.Latitude__c && shop.Longitude__c) {
            // 지도 중심점 변경
            this.mapCenter = {
                location: {
                    Latitude: parseFloat(shop.Latitude__c),
                    Longitude: parseFloat(shop.Longitude__c)
                }
            };
            
            // 줌 레벨 증가
            this.zoomLevel = 16;
            
            // 마커 업데이트 (선택된 정비소 하이라이트)
            this.updateMapMarkersWithSelection(shopId);
            
            console.log('🗺️ 지도 업데이트 완료 - 중심점:', this.mapCenter.location, '줌:', this.zoomLevel);
        } else {
            console.warn('⚠️ 선택된 정비소에 좌표 정보가 없습니다:', shop.Name);
            console.log('🔄 즉시 좌표 조회 시작...');
            
            // 즉시 좌표 조회 및 지도 이동
            this.getCoordinatesAndMoveMap(shop);
        }
    }

    async getCoordinatesAndMoveMap(shop) {
        try {
            console.log('📍 좌표 즉시 조회 중:', shop.Name, '주소:', shop.Address__c);
            
            if (!shop.Address__c || shop.Address__c.trim() === '') {
                console.warn('⚠️ 주소 정보가 없어 좌표를 조회할 수 없습니다.');
                this.dispatchEvent(new ShowToastEvent({
                    title: '주소 정보 없음',
                    message: shop.Name + '에 주소 정보가 없어 지도를 이동할 수 없습니다.',
                    variant: 'warning'
                }));
                return;
            }
            
            // Google API로 좌표 조회
            const coordinates = await getCoordinatesFromAddress({ address: shop.Address__c });
            
            console.log('🔍 API 응답 원본:', coordinates);
            
            if (coordinates && coordinates.latitude && coordinates.longitude) {
                console.log('✅ 좌표 조회 성공:', coordinates);
                
                // 지도 중심점 즉시 이동
                this.mapCenter = {
                    location: {
                        Latitude: parseFloat(coordinates.latitude),
                        Longitude: parseFloat(coordinates.longitude)
                    }
                };
                
                // 줌 레벨 증가
                this.zoomLevel = 16;
                
                // repairShops 배열에서 해당 정비소를 찾아서 좌표 업데이트
                this.repairShops = this.repairShops.map(s => {
                    if (s.Id === shop.Id) {
                        return {
                            ...s,
                            Latitude__c: coordinates.latitude,
                            Longitude__c: coordinates.longitude
                        };
                    }
                    return s;
                });
                
                // 마커 업데이트
                this.updateMapMarkersWithSelection(shop.Id);
                
                console.log('🗺️ 즉시 지도 이동 완료 - 중심점:', this.mapCenter.location);
                
                this.dispatchEvent(new ShowToastEvent({
                    title: '지도 이동 완료',
                    message: shop.Name + ' 위치로 지도를 이동했습니다.',
                    variant: 'success'
                }));
                
            } else {
                console.warn('❌ 좌표 조회 실패');
                this.dispatchEvent(new ShowToastEvent({
                    title: '좌표 조회 실패',
                    message: shop.Name + '의 좌표를 찾을 수 없습니다.',
                    variant: 'warning'
                }));
            }
            
        } catch (error) {
            console.error('❌ 좌표 조회 중 오류:', error);
            this.dispatchEvent(new ShowToastEvent({
                title: '좌표 조회 오류',
                message: '좌표를 조회하는 중 오류가 발생했습니다.',
                variant: 'error'
            }));
        }
    }

    handlePrevious() {
        this.dispatchEvent(new CustomEvent('previous'));
    }

    async handleRefresh() {
        try {
            console.log('🔄 정비소 데이터 새로고침 시작');
            
            // 현재 검색 조건으로 다시 조회
            const data = await getRepairShops({
                province: this.selectedProvince,
                city: this.selectedCity
            });

            this.repairShops = data.map(shop => {
                // 기존 선택 상태 유지
                const wasSelected = shop.Id === this.selectedRepairShopId;
                return {
                    ...shop,
                    isSelected: wasSelected,
                    cssClass: wasSelected ? 'repair-shop selected' : 'repair-shop'
                };
            });
            
            // 지도 마커와 중심점 업데이트
            this.updateMapMarkers();
            if (this.selectedRepairShopId) {
                this.updateMapMarkersWithSelection(this.selectedRepairShopId);
            }
            
            console.log('✅ 새로고침 완료 - 총 정비소 수:', this.repairShops.length);
            
            // 좌표가 업데이트된 정비소 수 확인
            const shopsWithCoords = this.repairShops.filter(shop => 
                shop.Latitude__c && shop.Longitude__c
            ).length;
            
            this.dispatchEvent(new ShowToastEvent({
                title: '새로고침 완료',
                message: `정비소 데이터가 업데이트되었습니다. (좌표 있음: ${shopsWithCoords}개)`,
                variant: 'success'
            }));
            
        } catch (error) {
            console.error('❌ 새로고침 실패:', error);
            this.dispatchEvent(new ShowToastEvent({
                title: '새로고침 실패',
                message: '데이터를 새로고침하는 중 오류가 발생했습니다.',
                variant: 'error'
            }));
        }
    }

    handleNext() {
        if (!this.selectedRepairShopId) {
            this.dispatchEvent(new ShowToastEvent({
                title: '정비소 미선택',
                message: '정비소를 선택해주세요.',
                variant: 'warning'
            }));
            return;
        }

        const selectedShop = this.repairShops.find(shop => shop.Id === this.selectedRepairShopId);
        console.log('🚀 STEP 4 → 5 전환');
        console.log('선택된 정비소 ID:', this.selectedRepairShopId);
        console.log('선택된 정비소 이름:', selectedShop ? selectedShop.Name : 'undefined');
        
        this.dispatchEvent(new CustomEvent('nextstep', {
            detail: { 
                repairShopId: this.selectedRepairShopId,
                repairShopName: selectedShop ? selectedShop.Name : '선택된 정비소'
            }
        }));
    }
}
