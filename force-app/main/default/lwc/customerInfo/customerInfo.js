// ✅ 수정된 파일: customerInfo.js
import { LightningElement, wire } from 'lwc';
import getCustomerInfo from '@salesforce/apex/CustomerInfoController.getCustomerInfo';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class CustomerInfo extends LightningElement {
    name;
    phone;
    email;
    accountId;

    @wire(getCustomerInfo)
    wiredCustomer({ error, data }) {
        console.log('🔍 customerInfo 컴포넌트 @wire 호출됨');
        console.log('🔍 data:', data);
        console.log('🔍 error:', error);
        
        if (data) {
            console.log('🔍 데이터 받음:', data);
            this.name = data.Name;
            this.phone = data.Phone;
            this.email = data.PersonEmail;
            this.accountId = data.Id;
        } else if (error) {
            console.error('🔍 Error fetching customer info:', error);
        }
    }

    handleNext() {
        if (!this.accountId) {
            this.dispatchEvent(new ShowToastEvent({
                title: '고객 정보 없음',
                message: '고객 정보를 불러오지 못했습니다.',
                variant: 'error'
            }));
            return;
        }

        this.dispatchEvent(new CustomEvent('nextstep', {
            detail: {
                customerInfo: {
                    name: this.name,
                    phone: this.phone,
                    email: this.email,
                    accountId: this.accountId
                }
            }
        }));
    }
}
