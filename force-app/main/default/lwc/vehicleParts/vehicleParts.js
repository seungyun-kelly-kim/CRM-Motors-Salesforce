import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getVehicleParts from '@salesforce/apex/PartsController.getVehicleParts';

export default class VehicleParts extends LightningElement {
    @api vehicleId; // 차량 ID를 외부에서 받아올 수 있도록
    @track parts = [];
    @track filteredParts = [];
    @track searchTerm = '';
    @track isLoading = false;
    @track error;

    connectedCallback() {
        this.loadParts();
    }

    loadParts() {
        this.isLoading = true;
        this.error = undefined;
        
        getVehicleParts()
            .then(data => {
                this.parts = this.processPartsData(data);
                this.filterParts(); // 초기에는 3개만 표시
                this.error = undefined;
                this.isLoading = false;
            })
            .catch(error => {
                this.error = '부품 정보를 불러오는데 실패했습니다.';
                this.parts = [];
                this.filteredParts = [];
                this.isLoading = false;
                console.error('부품 데이터 조회 오류:', error);
                
                this.dispatchEvent(new ShowToastEvent({
                    title: '오류',
                    message: this.error,
                    variant: 'error'
                }));
            });
    }


    processPartsData(rawParts) {
        return rawParts.map(part => {
            const stockRate = part.InvertoryRate || 0;
            
            return {
                ...part,
                stockRateFormatted: Math.round(stockRate),
                gaugeStyle: this.getGaugeStyle(stockRate),
                classificationLabel: this.getClassificationLabel(part.PartsClassification)
            };
        });
    }

    // 검색어 변경 처리
    handleSearchChange(event) {
        this.searchTerm = event.target.value;
        this.filterParts();
    }

    // 부품 필터링 (분류명으로만)
    filterParts() {
        if (!this.searchTerm || this.searchTerm.trim() === '') {
            // 검색어가 없으면 재고율 낮은 순서로 3개만 표시
            this.filteredParts = this.parts.slice(0, 3);
        } else {
            const searchTermLower = this.searchTerm.toLowerCase().trim();
            this.filteredParts = this.parts.filter(part => {
                const classificationLabel = part.classificationLabel ? part.classificationLabel.toLowerCase() : '';
                
                return classificationLabel.includes(searchTermLower);
            });
        }
    }

    getClassificationLabel(apiValue) {
        const classificationMap = {
            'EngineMotor': '엔진/모터',
            'Gearbox': '변속기',
            'Battery': '배터리',
            'AirCon': '에어컨',
            'Fuse': '퓨즈/램프/배터리',
            'Wiper': '와이퍼 블레이드'
        };
        return classificationMap[apiValue] || apiValue;
    }

    getGaugeStyle(stockRate) {
        const percentage = Math.min(Math.max(stockRate || 0, 0), 100);
        let color = '#4CAF50'; // 기본 녹색
        
        // 재고율에 따른 색상 변경
        if (percentage < 20) {
            color = '#F44336'; // 빨간색 (재고 부족)
        } else if (percentage < 50) {
            color = '#FF9800'; // 주황색 (재고 주의)
        } else if (percentage < 80) {
            color = '#2196F3'; // 파란색 (재고 양호)
        }
        
        return `width: ${percentage}%; background-color: ${color};`;
    }

    formatPrice(price) {
        if (!price) return '0';
        return new Intl.NumberFormat('ko-KR').format(price);
    }

    // 부품 카드 클릭 이벤트
    handlePartClick(event) {
        const partId = event.currentTarget.dataset.partId;
        const selectedPart = this.parts.find(part => part.Id === partId);
        
        if (selectedPart) {
            // 부품 선택 이벤트 발생
            this.dispatchEvent(new CustomEvent('partselected', {
                detail: {
                    partId: selectedPart.Id,
                    partName: selectedPart.Name,
                    partData: selectedPart
                }
            }));
        }
    }

    // 외부에서 호출할 수 있는 새로고침 메서드
    @api
    refreshParts() {
        this.loadParts();
        return getVehicleParts()
            .then(data => {
                this.parts = this.processPartsData(data);
                this.filterParts(); // 새로고침 후에도 필터 적용
                this.error = undefined;
            })
            .catch(error => {
                this.error = '부품 정보를 새로고침하는데 실패했습니다.';
                console.error('부품 새로고침 오류:', error);
                
                this.dispatchEvent(new ShowToastEvent({
                    title: '새로고침 오류',
                    message: this.error,
                    variant: 'error'
                }));
            })
            .finally(() => {
                this.isLoading = false;
            });
    }
}