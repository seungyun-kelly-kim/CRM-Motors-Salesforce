import { LightningElement, track, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import CRMAUTOQ from '@salesforce/resourceUrl/CRMAUTOQ';

export default class NavigationBar extends NavigationMixin(LightningElement) {
    @track isMobileMenuOpen = false;
    @track logoLoadError = false;
    
    // Static Resource를 변수에 저장
    logoImg = CRMAUTOQ;
    
    // 기존 API properties 유지 (하위 호환성)
    @api logoUrl;
    @api logoText = 'CRM AUTOQ';
    
    // 실제 사용할 로고 URL getter
    get actualLogoUrl() {
        // logoUrl이 설정되어 있으면 그것을 사용, 없으면 Static Resource 사용
        return this.logoUrl || this.logoImg;
    }
    
    get displayLogo() {
        return this.actualLogoUrl && !this.logoLoadError;
    }
    
    handleLogoError() {
        this.logoLoadError = true;
        console.error('Logo failed to load:', this.actualLogoUrl);
    }
    
    get mobileMenuClass() {
        return `mobile-menu ${this.isMobileMenuOpen ? 'mobile-menu-open' : ''}`;
    }
    
    handleMenuClick(event) {
        event.preventDefault();
        const menuType = event.target.dataset.menu;
        
        // 메뉴 클릭 이벤트 발생
        this.dispatchEvent(new CustomEvent('menuselect', {
            detail: {
                menuType: menuType,
                menuLabel: event.target.textContent.trim()
            }
        }));
        
        // 네비게이션 로직 (Experience Cloud 페이지로 이동)
        this.navigateToPage(menuType);
    }
    
    handleMobileMenuClick(event) {
        event.preventDefault();
        const menuType = event.target.dataset.menu;
        
        // 모바일 메뉴 닫기
        this.isMobileMenuOpen = false;
        
        // 메뉴 클릭 이벤트 발생
        this.dispatchEvent(new CustomEvent('menuselect', {
            detail: {
                menuType: menuType,
                menuLabel: event.target.textContent.trim()
            }
        }));
        
        // 네비게이션 로직
        this.navigateToPage(menuType);
    }
    
    navigateToPage(menuType) {
        // Experience Cloud 페이지 이름 매핑
        const pageMapping = {
            'maintenance': 'maintenance',
            'charging': 'charging', 
            'premium-care': 'premium-care',
            'in-payment': 'in-payment'
        };
        
        const pageName = pageMapping[menuType];
        if (pageName) {
            this[NavigationMixin.Navigate]({
                type: 'comm__namedPage',
                attributes: {
                    name: pageName
                }
            });
        }
    }
    
    handleLogin(event) {
        event.preventDefault();
        
        // 로그인 이벤트 발생
        this.dispatchEvent(new CustomEvent('login'));
        
        // 로그인 페이지로 이동
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                name: 'login'
            }
        });
    }
    
    handleSignup(event) {
        event.preventDefault();
        
        // 회원가입 이벤트 발생
        this.dispatchEvent(new CustomEvent('signup'));
        
        // 회원가입 페이지로 이동
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                name: 'signup'
            }
        });
    }
    
    toggleMobileMenu(event) {
        event.preventDefault();
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
    }
    
    // 외부에서 호출할 수 있는 메서드
    @api
    closeMobileMenu() {
        this.isMobileMenuOpen = false;
    }
    
    @api
    setActiveMenu(menuType) {
        // 활성 메뉴 표시 로직 (필요시 구현)
        const menuLinks = this.template.querySelectorAll('.menu-link, .mobile-menu-link');
        menuLinks.forEach(link => {
            if (link.dataset.menu === menuType) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
}