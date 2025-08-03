import { createElement } from '@lwc/engine-dom';
import NavigationBar from 'c/navigationBar';

describe('c-navigation-bar', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders navigation menu items', () => {
        const element = createElement('c-navigation-bar', {
            is: NavigationBar
        });
        document.body.appendChild(element);

        const menuItems = element.shadowRoot.querySelectorAll('.menu-link');
        expect(menuItems).toHaveLength(4);
        
        const menuTexts = Array.from(menuItems).map(item => item.textContent.trim());
        expect(menuTexts).toContain('정비');
        expect(menuTexts).toContain('충전');
        expect(menuTexts).toContain('프리미엄 케어');
        expect(menuTexts).toContain('인카페이먼트');
    });

    it('renders action buttons', () => {
        const element = createElement('c-navigation-bar', {
            is: NavigationBar
        });
        document.body.appendChild(element);

        const loginButton = element.shadowRoot.querySelector('.action-button.secondary');
        const signupButton = element.shadowRoot.querySelector('.action-button.primary');
        
        expect(loginButton.textContent.trim()).toBe('로그인');
        expect(signupButton.textContent.trim()).toBe('회원가입');
    });

    it('toggles mobile menu', () => {
        const element = createElement('c-navigation-bar', {
            is: NavigationBar
        });
        document.body.appendChild(element);

        const mobileToggle = element.shadowRoot.querySelector('.mobile-menu-toggle');
        const mobileMenu = element.shadowRoot.querySelector('.mobile-menu');
        
        // Initially closed
        expect(mobileMenu.classList.contains('mobile-menu-open')).toBe(false);
        
        // Click to open
        mobileToggle.click();
        
        return Promise.resolve().then(() => {
            expect(mobileMenu.classList.contains('mobile-menu-open')).toBe(true);
        });
    });

    it('dispatches menu select event', () => {
        const element = createElement('c-navigation-bar', {
            is: NavigationBar
        });
        document.body.appendChild(element);

        const handler = jest.fn();
        element.addEventListener('menuselect', handler);

        const menuLink = element.shadowRoot.querySelector('[data-menu="maintenance"]');
        menuLink.click();

        expect(handler).toHaveBeenCalledWith(
            expect.objectContaining({
                detail: {
                    menuType: 'maintenance',
                    menuLabel: '정비'
                }
            })
        );
    });
});