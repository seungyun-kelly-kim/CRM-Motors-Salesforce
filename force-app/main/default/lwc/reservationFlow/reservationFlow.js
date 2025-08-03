// ✅ reservationFlow.js 통합 - STEP6 핸들러 추가
import { LightningElement, track } from 'lwc';

export default class ReservationFlow extends LightningElement {
    @track step = 1;

    @track customerInfo = {};
    @track assetInfo = {};
    @track assetId = ''; // Asset ID 저장
    @track serviceDetails = {};
    @track serviceType = ''; // 🟡 Controlling Field 값 저장
    @track serviceTypeValue = ''; // Service_Type__c 값 저장
    @track repairShopId = '';
    @track repairShopName = '';
    @track selectedDate = '';
    @track selectedSlotTime = '';

    get isStep1() { return this.step === 1; }
    get isStep2() { return this.step === 2; }
    get isStep3() { return this.step === 3; }
    get isStep4() { return this.step === 4; }
    get isStep5() { return this.step === 5; }
    get isStep6() { return this.step === 6; }
    get isStep7() { return this.step === 7; } // 완료 화면
    
    // 안전한 serviceDetails 접근을 위한 getter
    get selectedServiceDetails() {
        console.log('🔍 [reservationFlow] selectedServiceDetails getter 호출됨');
        console.log('🔍 [reservationFlow] this.serviceDetails:', this.serviceDetails);
        console.log('🔍 [reservationFlow] ServiceReservationTypeDetails__c:', this.serviceDetails?.ServiceReservationTypeDetails__c);
        return this.serviceDetails?.ServiceReservationTypeDetails__c || '';
    }

    handleStep1(event) {
        console.log('🔄 STEP 1 → 2');
        console.log('🔍 [reservationFlow] 받은 customerInfo:', event.detail.customerInfo);
        this.customerInfo = event.detail.customerInfo;
        console.log('🔍 [reservationFlow] 저장된 customerInfo:', this.customerInfo);
        console.log('🔍 [reservationFlow] accountId:', this.customerInfo?.accountId);
        this.step = 2;
    }

    handleStep2(event) {
        console.log('🔄 STEP 2 → 3');
        this.assetInfo = event.detail.assetInfo;
        this.assetId = event.detail.assetId; // Asset ID 저장
        this.step = 3;
    }

    handleStep3(event) {
        console.log('🔄 STEP 3 → 4');
        console.log('🔍 [reservationFlow] Step3에서 받은 데이터:', event.detail);
        console.log('🔍 [reservationFlow] serviceReservationData:', event.detail.serviceReservationData);
        
        this.serviceDetails = event.detail.serviceReservationData;
        this.serviceType = event.detail.serviceReservationData.ServiceReservationType__c; // 🟡 serviceType 저장
        this.serviceTypeValue = event.detail.serviceReservationData.Service_Type__c; // Service_Type__c 값 저장
        
        console.log('🔍 [reservationFlow] 저장된 serviceDetails:', this.serviceDetails);
        console.log('🔍 [reservationFlow] ServiceReservationTypeDetails__c:', this.serviceDetails.ServiceReservationTypeDetails__c);
        
        this.step = 4;
    }

    handleStep4(event) {
        console.log('🔄 STEP 4 → 5');
        console.log('받은 데이터:', event.detail);
        this.repairShopId = event.detail.repairShopId;
        this.repairShopName = event.detail.repairShopName;
        console.log('저장된 정비소 ID:', this.repairShopId);
        console.log('저장된 정비소 이름:', this.repairShopName);
        this.step = 5;
    }

    handleStep5(event) {
        console.log('🔄 STEP 5 → 6');
        this.selectedDate = event.detail.selectedDate;
        this.selectedSlotTime = event.detail.selectedSlotTime;
        this.step = 6;
    }

    handleStep6(event) {
        console.log('🔄 STEP 6 → 7 (완료)');
        console.log('예약 완료 이벤트 받음:', event.detail);
        
        if (event.detail.success) {
            this.step = 7; // 완료 화면으로 이동
        }
    }

    handlePrevious() {
        console.log('🔙 이전 단계로 이동: ' + (this.step - 1));
        if (this.step > 1) {
            this.step = this.step - 1;
        }
    }
}