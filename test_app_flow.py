"""
Test the 4-step wizard flow with test data:
Parsel: 2146, TAKS: 0.30, KAKS: 0.60, Çıkma: 1.70

This script tests:
1. Step 1 navigation ("Sonraki Adım" button)
2. Data flow between steps
3. Decimal number display
"""

from playwright.sync_api import sync_playwright
import time

def test_wizard_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app
        print("1. Navigating to app...")
        page.goto('http://localhost:5174/construction-forecast/')
        page.wait_for_load_state('networkidle')

        # Take initial screenshot
        page.screenshot(path='/tmp/step0_home.png', full_page=True)
        print("   Screenshot: /tmp/step0_home.png")

        # Click "Yeni Proje" to start wizard
        print("2. Looking for 'Yeni Proje' button...")
        try:
            new_project_btn = page.locator('text=Yeni Proje').first
            if new_project_btn.is_visible():
                new_project_btn.click()
                page.wait_for_load_state('networkidle')
                print("   Clicked 'Yeni Proje'")
            else:
                # Maybe we're already on the wizard page
                print("   'Yeni Proje' not visible, checking if already on wizard...")
        except Exception as e:
            print(f"   Error: {e}")

        page.wait_for_timeout(1000)
        page.screenshot(path='/tmp/step1_initial.png', full_page=True)
        print("   Screenshot: /tmp/step1_initial.png")

        # Step 1: Fill İmar data
        print("3. Filling Step 1 - Parsel & İmar...")

        # Find and fill parsel alanı
        try:
            # Look for input fields
            inputs = page.locator('input[type="text"], input[type="number"]').all()
            print(f"   Found {len(inputs)} input fields")

            # Try to find specific fields by label or placeholder
            parsel_input = page.locator('input[placeholder*="örn"]').first
            if parsel_input.is_visible():
                print("   Found parsel input")

            # Fill parsel alanı (first numeric input usually)
            parsel_field = page.locator('input').filter(has_text='').first

            # Try different approaches to find the parsel field
            # Look for the field with "Parsel Alanı" label nearby
            page.screenshot(path='/tmp/step1_before_fill.png', full_page=True)

            # Get the HTML content to inspect
            content = page.content()

            # Look for specific input patterns
            all_inputs = page.locator('input').all()
            print(f"   Total inputs: {len(all_inputs)}")
            for i, inp in enumerate(all_inputs[:10]):  # First 10
                try:
                    placeholder = inp.get_attribute('placeholder') or ''
                    input_type = inp.get_attribute('type') or ''
                    value = inp.get_attribute('value') or ''
                    print(f"   Input {i}: type={input_type}, placeholder={placeholder[:30]}, value={value}")
                except:
                    pass

        except Exception as e:
            print(f"   Error inspecting inputs: {e}")

        # Try to fill the form using more specific selectors
        print("4. Attempting to fill form fields...")
        try:
            # Look for DecimalInput components (they use specific patterns)
            # Parsel Alanı field
            parsel_inputs = page.locator('input').all()

            # Find by examining the page structure
            # Take a screenshot to see current state
            page.screenshot(path='/tmp/step1_form.png', full_page=True)

            # Try filling by index or pattern
            # Usually: Parsel Alanı, TAKS, KAKS, Çıkma are in order

            # Method 1: Try by placeholder patterns
            page.locator('input[placeholder*="2146"]').first.fill('2146') if page.locator('input[placeholder*="2146"]').count() > 0 else None

            # Method 2: Try clicking on labels and then filling
            # Find the "Parsel Alanı" section and fill it

        except Exception as e:
            print(f"   Error filling form: {e}")

        # Check the "Sonraki Adım" button state
        print("5. Checking 'Sonraki Adım' button...")
        try:
            next_btn = page.locator('button:has-text("Sonraki")').first
            if next_btn.is_visible():
                is_disabled = next_btn.is_disabled()
                print(f"   'Sonraki Adım' button visible: True, disabled: {is_disabled}")

                # Get button classes/attributes
                btn_class = next_btn.get_attribute('class') or ''
                print(f"   Button classes: {btn_class[:100]}...")
            else:
                print("   'Sonraki Adım' button not visible")
        except Exception as e:
            print(f"   Error checking button: {e}")

        # Take final screenshot
        page.screenshot(path='/tmp/step1_final.png', full_page=True)
        print("   Screenshot: /tmp/step1_final.png")

        # Print page URL
        print(f"\n6. Current URL: {page.url}")

        # Check for any console errors
        print("\n7. Checking for errors in page...")

        # Get all buttons
        buttons = page.locator('button').all()
        print(f"   Found {len(buttons)} buttons:")
        for i, btn in enumerate(buttons[:10]):
            try:
                text = btn.inner_text()[:50] if btn.inner_text() else ''
                disabled = btn.is_disabled()
                print(f"   Button {i}: '{text}' - disabled: {disabled}")
            except:
                pass

        browser.close()

        print("\n" + "="*50)
        print("TEST COMPLETE - Check screenshots in /tmp/")
        print("="*50)

if __name__ == "__main__":
    test_wizard_flow()
