import { LightningElement, track, api } from 'lwc';
import getPlaceSuggestions from '@salesforce/apex/GooglePlacesController.getPlaceSuggestions';
import getPlaceDetails from '@salesforce/apex/GooglePlacesController.getPlaceDetails';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ContractMap extends LightningElement {
    @api recordId;
    @track searchQuery = '';
    @track suggestions = [];
    @track mapCenter = { location: { Latitude: 37.5665, Longitude: 126.9780 } };
    @track mapMarkers = [];

    @track showDetailInput = false;
    @track detailAddress = '';
    @track selectedAddress = null;

    handleSearch(event) {
        this.searchQuery = event.target.value;
        if (this.searchQuery.length < 2) return;

        getPlaceSuggestions({ input: this.searchQuery })
            .then(result => {
                this.suggestions = JSON.parse(result).predictions;
            })
            .catch(console.error);
    }

    handleSelect(event) {
        const placeId = event.currentTarget.dataset.id;
        getPlaceDetails({ placeId })
            .then(result => {
                const place = JSON.parse(result).result;
                this.selectedAddress = place; // 저장을 위해 저장해둠
                const lat = place.geometry.location.lat;
                const lng = place.geometry.location.lng;

                this.mapCenter = { location: { Latitude: lat, Longitude: lng } };
                this.mapMarkers = [{
                    location: { Latitude: lat, Longitude: lng },
                    title: place.name,
                    description: place.formatted_address
                }];
                this.suggestions = [];

                this.searchQuery = place.formatted_address; // 사용자가 선택한 주소로 검색창 업데이트
                this.selectedAddress = place;
                this.showDetailInput = true; // 상세주소 입력창 보이기
            })
            .catch(console.error);
    }

    handleDetailChange(event) {
        this.detailAddress = event.target.value;
    }

    handleSaveFullAddress() {
        const place = this.selectedAddress;
        if (!place) return;

        const components = place.address_components;
        const get = (type) => {
            const comp = components.find(c => c.types.includes(type));
            return comp ? comp.long_name : '';
        };

        let state = get('administrative_area_level_1');
        const stateMap = {
            '서울특별시': 'Seoul',
            '부산광역시': 'Busan',
            '대구광역시': 'Daegu',
            '인천광역시': 'Incheon',
            '광주광역시': 'Gwangju',
            '대전광역시': 'Daejeon',
            '울산광역시': 'Ulsan',
            '세종특별자치시': 'Sejong',
            '경기도': 'Gyeonggi-do',
            '강원도': 'Gangwon-do',
            '강원특별자치도': 'Gangwon-do',
            '충청북도': 'Chungcheongbuk-do',
            '충청남도': 'Chungcheongnam-do',
            '전라북도': 'Jeollabuk-do',
            '전라남도': 'Jeollanam-do',
            '경상북도': 'Gyeongsangbuk-do',
            '경상남도': 'Gyeongsangnam-do',
            '제주특별자치도': 'Jeju-do',
            '제주도': 'Jeju-do'
        };
        if (stateMap[state]) {
            state = stateMap[state];
        }

        let country = get('country');
        if (country === '대한민국' || country === 'South Korea' || country === 'Republic of Korea') {
            country = 'Korea, Republic of';
        }

        const city = get('sublocality') || get('locality');
        const postal = get('postal_code');

        const fullStreet = `${place.formatted_address} ${this.detailAddress || ''}`.trim();

        const fields = {
            Id: this.recordId,
            ShippingStreet: fullStreet,
            ShippingCity: city,
            ShippingState: state,
            ShippingPostalCode: postal,
            ShippingCountry: country
        };

        updateRecord({ fields })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: '주소 저장 완료',
                        message: '상세 주소까지 함께 저장되었습니다.',
                        variant: 'success'
                    })
                );
                this.showDetailInput = false;
                this.detailAddress = '';
            })
            .catch(error => {
                console.error('🔴 상세 주소 저장 실패:', error);
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: '주소 저장 실패',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }
}
