import { LightningElement, api, wire } from 'lwc';
import getAccountInfo from '@salesforce/apex/AccountInfoController.getAccountInfo';

export default class AccountCustomerInfo extends LightningElement {
    @api recordId;
    
    account;
    error;

    @wire(getAccountInfo, { accountId: '$recordId' })
    wiredAccount({ error, data }) {
        console.log('Customer Info - RecordId:', this.recordId);
        console.log('Customer Info - Data:', data);
        console.log('Customer Info - Error:', error);
        
        if (data) {
            this.account = data;
            this.error = undefined;
            console.log('Customer Info - Account loaded:', this.account);
        } else if (error) {
            this.error = error;
            this.account = undefined;
            console.error('Customer Info - Error loading account:', error);
        }
    }

    get customerName() {
        return this.account?.Name || 'Tom Ko';
    }

    get email() {
        return this.account?.PersonEmail || 'tom.ko@gmail.com';
    }

    get phone() {
        return this.account?.Phone || '+61 479 351 768';
    }

    get mobilePhone() {
        return this.account?.PersonMobilePhone || '+61 479 351 768';
    }

    get birthdate() {
        const birth = this.account?.PersonBirthdate;
        return birth ? new Date(birth).toLocaleDateString('ko-KR') : '1985-03-15';
    }

    get gender() {
        return this.account?.Gender__c || '남성';
    }

    get address() {
        return this.account?.PersonMailingAddress || 'Sydney, NSW, Australia';
    }

    get marketingConsent() {
        return this.account?.Marketing_Consent__c ? '동의' : '동의';
    }

    get marketingConsentClass() {
        return 'consent-agreed';
    }

    get ownerSince() {
        return '2009';
    }

    get ownerId() {
        return 'HDM20A09876';
    }
}