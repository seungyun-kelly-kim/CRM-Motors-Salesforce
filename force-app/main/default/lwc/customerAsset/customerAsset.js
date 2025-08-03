import { LightningElement, wire, track, api } from 'lwc';
import getAssetsByAccount from '@salesforce/apex/CustomerAssetController.getAssetsByAccount';

export default class CustomerAsset extends LightningElement {
    @track assets = [];
    @api customerInfo;

    @wire(getAssetsByAccount, { accountId: '$customerInfo.accountId' })
    wiredAssets({ error, data }) {
        console.log('🔍 [customerAsset] @wire 호출됨');
        console.log('🔍 [customerAsset] customerInfo:', this.customerInfo);
        console.log('🔍 [customerAsset] accountId:', this.customerInfo?.accountId);
        console.log('🔍 [customerAsset] data:', data);
        console.log('🔍 [customerAsset] error:', error);
        
        if (data) {
            console.log('✅ [customerAsset] Assets 데이터 받음:', data);
            this.assets = data.map(asset => ({
                ...asset,
                formattedWarrantyDate: asset.warrantyExpirationDate ? this.formatDate(asset.warrantyExpirationDate) : null,
                warrantyIcon: asset.isWarrantyValid ? 'utility:check' : 'utility:close',
                warrantyIconVariant: asset.isWarrantyValid ? 'success' : 'error',
                warrantyStatusText: asset.isWarrantyValid ? '보증 기간 유효' : '보증 기간 만료'
            }));
        } else if (error) {
            console.error('❌ [customerAsset] Error fetching assets:', error);
        }
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    handleNext() {
        if (!this.assets || this.assets.length === 0) {
            this.dispatchEvent(new CustomEvent('nextstep', {
                detail: {
                    assetInfo: null
                }
            }));
        } else {
            const selectedAsset = this.assets[0]; // 첫 번째 차량을 선택
            this.dispatchEvent(new CustomEvent('nextstep', {
                detail: {
                    assetInfo: selectedAsset,
                    assetId: selectedAsset.assetInfo.Id // Asset ID 명시적 전달
                }
            }));
        }
    }

    handlePrevious() {
        this.dispatchEvent(new CustomEvent('previous'));
    }
}
