import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { updateRecord } from 'lightning/uiRecordApi';

export default class KoreanAddressMap extends LightningElement {
    @api recordId;
    @track searchQuery = '';
    @track mapMarkers = [];
    @track mapCenter = { Latitude: 37.5665, Longitude: 126.9780 }; // 서울 기본값
    @track showDetailInput = false;
    @track detailAddress = '';
    @track selectedAddress = null;
    @track addressSuggestions = [];

    // 한국 주요 도시와 지역 데이터
    koreanAddresses = [
        { name: '서울특별시 강남구 테헤란로', lat: 37.5012767, lng: 127.0396597 },
        { name: '서울특별시 종로구 종로', lat: 37.5720161, lng: 126.9794068 },
        { name: '서울특별시 마포구 홍대입구', lat: 37.5563017, lng: 126.9236066 },
        { name: '부산광역시 해운대구 해운대해변로', lat: 35.1587177, lng: 129.1603577 },
        { name: '부산광역시 남구 용호로', lat: 35.1367847, lng: 129.1154798 },
        { name: '대구광역시 중구 동성로', lat: 35.8688416, lng: 128.5934096 },
        { name: '인천광역시 연수구 송도국제도시', lat: 37.3894119, lng: 126.6513169 },
        { name: '광주광역시 동구 금남로', lat: 35.1498211, lng: 126.9196633 },
        { name: '대전광역시 유성구 대학로', lat: 36.3740697, lng: 127.3602795 },
        { name: '울산광역시 남구 삼산로', lat: 35.5396538, lng: 129.3115895 },
        { name: '경기도 수원시 영통구 월드컵로', lat: 37.2635727, lng: 127.0286009 },
        { name: '경기도 성남시 분당구 판교역로', lat: 37.3947747, lng: 127.1113461 },
        { name: '경기도 고양시 일산동구 장항동', lat: 37.6583574, lng: 126.7702978 },
        { name: '강원도 춘천시 춘천로', lat: 37.8813153, lng: 127.7298393 },
        { name: '충청북도 청주시 흥덕구 가경동', lat: 36.6282844, lng: 127.4570503 },
        { name: '충청남도 천안시 동남구 병천면', lat: 36.7870488, lng: 127.1753804 },
        { name: '전라북도 전주시 완산구 한옥마을길', lat: 35.8160535, lng: 127.1531594 },
        { name: '전라남도 여수시 돌산읍 돌산로', lat: 34.7462057, lng: 127.7348877 },
        { name: '경상북도 경주시 불국로', lat: 35.7901137, lng: 129.3313950 },
        { name: '경상남도 창원시 성산구 중앙대로', lat: 35.2271311, lng: 128.6818421 },
        { name: '제주특별자치도 제주시 연동', lat: 33.4890113, lng: 126.4983023 },
        { name: '제주특별자치도 서귀포시 중문관광로', lat: 33.2565715, lng: 126.4120275 }
    ];

    handleSearchInput(event) {
        this.searchQuery = event.target.value;
        if (this.searchQuery.length < 2) {
            this.addressSuggestions = [];
            return;
        }

        // 한글 주소 필터링
        this.addressSuggestions = this.koreanAddresses
            .filter(addr => addr.name.includes(this.searchQuery))
            .slice(0, 10); // 최대 10개만 표시
    }

    handleSelectAddress(event) {
        const selectedName = event.currentTarget.dataset.name;
        const selectedAddr = this.koreanAddresses.find(addr => addr.name === selectedName);
        
        if (selectedAddr) {
            this.searchQuery = selectedAddr.name;
            this.selectedAddress = selectedAddr;
            this.addressSuggestions = [];
            
            // 지도 중심점과 마커 업데이트
            this.mapCenter = { 
                Latitude: selectedAddr.lat, 
                Longitude: selectedAddr.lng 
            };
            
            this.mapMarkers = [{
                location: { 
                    Latitude: selectedAddr.lat, 
                    Longitude: selectedAddr.lng 
                },
                title: '선택된 위치',
                description: selectedAddr.name,
                icon: 'standard:location'
            }];

            this.showDetailInput = true;
        }
    }

    handleDetailChange(event) {
        this.detailAddress = event.target.value;
    }

    handleSaveAddress() {
        if (!this.selectedAddress) {
            this.showToast('오류', '주소를 먼저 선택해주세요.', 'error');
            return;
        }

        const fullAddress = `${this.selectedAddress.name} ${this.detailAddress || ''}`.trim();
        
        // 주소 컴포넌트 파싱 (간단한 한국 주소 구조)
        const addressParts = this.selectedAddress.name.split(' ');
        let state = '', city = '', street = '';
        
        if (addressParts.length >= 3) {
            state = addressParts[0]; // 서울특별시, 부산광역시 등
            city = addressParts[1];  // 강남구, 해운대구 등  
            street = addressParts.slice(2).join(' '); // 나머지 주소
        }

        // 한국 지역명을 영문으로 매핑
        const stateMapping = {
            '서울특별시': 'Seoul',
            '부산광역시': 'Busan', 
            '대구광역시': 'Daegu',
            '인천광역시': 'Incheon',
            '광주광역시': 'Gwangju',
            '대전광역시': 'Daejeon',
            '울산광역시': 'Ulsan',
            '경기도': 'Gyeonggi-do',
            '강원도': 'Gangwon-do',
            '충청북도': 'Chungcheongbuk-do',
            '충청남도': 'Chungcheongnam-do', 
            '전라북도': 'Jeollabuk-do',
            '전라남도': 'Jeollanam-do',
            '경상북도': 'Gyeongsangbuk-do',
            '경상남도': 'Gyeongsangnam-do',
            '제주특별자치도': 'Jeju-do'
        };

        const fields = {
            Id: this.recordId,
            ShippingStreet: fullAddress,
            ShippingCity: city,
            ShippingState: stateMapping[state] || state,
            ShippingPostalCode: '', // 우편번호는 별도 API 필요
            ShippingCountry: 'Korea, Republic of'
        };

        updateRecord({ fields })
            .then(() => {
                this.showToast('성공', '주소가 성공적으로 저장되었습니다.', 'success');
                this.showDetailInput = false;
                this.detailAddress = '';
            })
            .catch(error => {
                console.error('주소 저장 실패:', error);
                this.showToast('오류', '주소 저장 중 오류가 발생했습니다.', 'error');
            });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        }));
    }

    handleCancel() {
        this.showDetailInput = false;
        this.detailAddress = '';
        this.selectedAddress = null;
    }

    // 주소 입력창 외부 클릭시 자동완성 숨기기
    handleBlur() {
        setTimeout(() => {
            this.addressSuggestions = [];
        }, 200);
    }
}