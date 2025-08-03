import { LightningElement, api, wire } from 'lwc';
import getWarranties from '@salesforce/apex/WarrantyController.getWarrantiesByAccount';

export default class AccountWarrantyList extends LightningElement {
    @api recordId;
    
    warranties;
    error;

    @wire(getWarranties, { accountId: '$recordId' })
    wiredWarranties({ error, data }) {
        console.log('Warranty - RecordId:', this.recordId);
        console.log('Warranty - Data:', data);
        console.log('Warranty - Error:', error);
        
        if (data) {
            this.warranties = data;
            this.error = undefined;
            console.log('Warranty - Warranties loaded:', this.warranties);
        } else if (error) {
            this.error = error;
            this.warranties = undefined;
            console.error('Warranty - Error loading warranties:', error);
        }
    }

    get hasWarranties() {
        return this.warranties && this.warranties.length > 0;
    }

    get formattedWarranties() {
        if (!this.warranties) return [];
        
        return this.warranties.map(warranty => {
            return {
                id: warranty.Id,
                name: warranty.Name || '보증서명 없음',
                registrationDate: this.formatDate(warranty.Registration_Date__c),
                expirationDate: this.formatDate(warranty.Expiration_Date__c),
                warrantyPeriod: warranty.Warranty_Period__c ? `${warranty.Warranty_Period__c}개월` : '정보 없음',
                warrantyMileage: warranty.Warranty_Mileage__c ? `${warranty.Warranty_Mileage__c.toLocaleString()}km` : '정보 없음',
                isExpired: this.isExpired(warranty.Expiration_Date__c),
                statusClass: this.getStatusClass(warranty.Expiration_Date__c)
            };
        });
    }

    formatDate(dateValue) {
        if (!dateValue) return '정보 없음';
        return new Date(dateValue).toLocaleDateString('ko-KR');
    }

    isExpired(expirationDate) {
        if (!expirationDate) return false;
        return new Date(expirationDate) < new Date();
    }

    getStatusClass(expirationDate) {
        if (!expirationDate) return 'status-unknown';
        
        const expDate = new Date(expirationDate);
        const today = new Date();
        const diffTime = expDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'status-expired';
        if (diffDays <= 30) return 'status-expiring';
        return 'status-active';
    }

    handleViewAll() {
        // Navigate to related list
        this[NavigationMixin.Navigate]({
            type: 'standard__recordRelationshipPage',
            attributes: {
                recordId: this.recordId,
                relationshipApiName: 'Warranty__c',
                actionName: 'view'
            }
        });
    }
}