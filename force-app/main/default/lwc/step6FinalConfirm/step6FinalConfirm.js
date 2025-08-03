import { LightningElement, api, track, wire } from 'lwc';
import assignTechnicianAndCreateCase from '@salesforce/apex/RepairReservationScheduler.assignTechnicianAndCreateCase';
import getPicklistLabelMap from '@salesforce/apex/RepairReservationScheduler.getPicklistLabelMap';
import previewTechnicianAssignment from '@salesforce/apex/RepairReservationScheduler.previewTechnicianAssignment';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class Step6FinalConfirm extends LightningElement {
    @api selectedServiceDetails; // string (semicolon-delimited)
    @api serviceType; // 🟡 Controlling Field 값 받기
    @api serviceTypeValue; // Service_Type__c 값 받기
    @api repairShopName;
    @api repairShopId;
    @api selectedDate; // YYYY-MM-DD
    @api selectedSlotTime; // HH:mm
    @api accountId;
    @api assetId; // Asset ID 받기
    @api description; // step3에서 전달받은 description

    @track submitting = false;
    @track picklistLabelMap = {};
    @track serviceTypeLabelMap = {};
    @track assignedTechnician = null;
    @track showTechnicianInfo = false;
    @track technicianPreview = null;

    @wire(getPicklistLabelMap, { objectName: 'Case', fieldName: 'ServiceReservationTypeDetails__c' })
    wiredPicklistMap({ data, error }) {
        if (data) {
            this.picklistLabelMap = data;
            console.log('🏷️ Picklist 라벨 맵 로드됨:', data);
        } else if (error) {
            console.error('❌ Picklist 라벨 맵 로드 실패:', error);
        }
    }

    @wire(getPicklistLabelMap, { objectName: 'Case', fieldName: 'ServiceReservationType__c' })
    wiredServiceTypeMap({ data, error }) {
        if (data) {
            this.serviceTypeLabelMap = data;
            console.log('🏷️ Service Type 라벨 맵 로드됨:', data);
        } else if (error) {
            console.error('❌ Service Type 라벨 맵 로드 실패:', error);
        }
    }

    connectedCallback() {
        console.log('🔍 [STEP6 디버그] 받은 데이터:');
        console.log('selectedServiceDetails:', this.selectedServiceDetails);
        console.log('repairShopId:', this.repairShopId);
        console.log('selectedDate:', this.selectedDate);
        console.log('selectedSlotTime:', this.selectedSlotTime);
        console.log('accountId:', this.accountId);
        
        // 정비사 미리 조회
        this.loadTechnicianPreview();
    }

    loadTechnicianPreview() {
        if (!this.repairShopId || !this.selectedDate || !this.selectedSlotTime || !this.selectedServiceDetails) {
            return;
        }

        const preferredDateString = `${this.selectedDate} ${this.selectedSlotTime}:00`;
        
        previewTechnicianAssignment({
            repairShopId: this.repairShopId,
            preferredDate: preferredDateString,
            selectedDetails: this.selectedServiceDetails
        })
        .then(result => {
            this.technicianPreview = result;
            this.showTechnicianInfo = result.available;
            console.log('🔍 [STEP6] 정비사 미리보기:', result);
        })
        .catch(error => {
            console.error('❌ [STEP6] 정비사 미리보기 실패:', error);
            this.technicianPreview = {
                available: false,
                message: '정비사 조회 중 오류가 발생했습니다.'
            };
        });
    }

    get serviceDetailsLabel() {
        if (!this.selectedServiceDetails || !this.picklistLabelMap) return '';
        
        // Org의 실제 picklist 라벨 사용
        return this.selectedServiceDetails
            .split(';')
            .map(apiName => this.picklistLabelMap[apiName] || apiName)
            .join(', ');
    }

    get serviceTypeLabel() {
        if (!this.serviceType || !this.serviceTypeLabelMap) return this.serviceType || '';
        
        // ServiceReservationType__c의 label 반환
        return this.serviceTypeLabelMap[this.serviceType] || this.serviceType;
    }

    get fullDateTime() {
        return `${this.selectedDate} ${this.selectedSlotTime}`;
    }

    handlePrevious() {
        this.dispatchEvent(new CustomEvent('previous'));
    }

    handleSubmit() {
        console.log('🚀 [STEP6] 최종 예약 처리 시작');
        
        if (!this.accountId || !this.repairShopId || !this.selectedDate || !this.selectedSlotTime || !this.selectedServiceDetails) {
            this.showToast('입력 누락', '예약 정보를 모두 확인해주세요.', 'error');
            return;
        }

        this.submitting = true;

        // 한국 시간대(KST)로 명시적 처리 - UTC+9 오프셋 적용
        const [year, month, day] = this.selectedDate.split('-');
        const [hour, minute] = this.selectedSlotTime.split(':');
        
        // 한국 시간을 UTC로 변환하지 말고 그대로 전송
        const preferredDateString = `${year}-${month}-${day} ${hour}:${minute}:00`;
        console.log('📅 [STEP6] 전송할 날짜 (KST 그대로):', preferredDateString);
        console.log('📊 [STEP6] 원본 데이터 - Date:', this.selectedDate, 'Time:', this.selectedSlotTime);

        assignTechnicianAndCreateCase({
            accountId: this.accountId,
            assetId: this.assetId,
            repairShopId: this.repairShopId,
            preferredDate: preferredDateString,
            selectedDetails: this.selectedServiceDetails,
            serviceType: this.serviceType, // 🟡 serviceType 파라미터 추가
            serviceTypeValue: this.serviceTypeValue, // Service_Type__c 값 추가
            description: this.description // step3에서 받은 description
        }).then(result => {
            console.log('✅ [STEP6] 예약 성공:', result);
            
            if (result.success) {
                this.showToast('예약 완료', '정비 예약이 성공적으로 접수되었습니다.', 'success');
                
                // 다음 단계로 이동
                this.dispatchEvent(new CustomEvent('nextstep', {
                    detail: { 
                        success: true,
                        step: 7,
                        technicianInfo: this.technicianPreview
                    }
                }));
            } else {
                this.showToast('예약 실패', result.message || '예약 중 문제가 발생했습니다.', 'error');
            }
        }).catch(error => {
            console.error('❌ [STEP6] 예약 실패:', error);
            this.showToast('예약 실패', '예약 중 문제가 발생했습니다.', 'error');
        }).finally(() => {
            this.submitting = false;
        });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}