"""
Complete test of the 4-step wizard flow with test data:
Parsel: 2146, TAKS: 0.30, KAKS: 0.60, Çıkma: 1.70

This script tests ALL 3 bugs:
1. Navigation bug (Step 1 → Step 2)
2. Data flow between steps
3. Decimal display formatting
"""

from playwright.sync_api import sync_playwright
import time
import re

def test_complete_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)  # headless for faster test
        page = browser.new_page()

        print("=" * 70)
        print("PHASE 0: FOUNDATION BUG TEST")
        print("Test Data: Parsel 2146m², TAKS 0.30, KAKS 0.60, Çıkma 1.70")
        print("=" * 70)

        bugs_found = []

        # Navigate to the app
        print("\n1. Navigating to app...")
        page.goto('http://localhost:5174/construction-forecast/')
        page.wait_for_load_state('networkidle')
        print("   ✓ Home page loaded")

        # Click "Yeni Proje" to start wizard
        print("\n2. Starting new project...")
        new_project_btn = page.locator('text=Yeni Proje').first
        new_project_btn.click()
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(500)

        # ============================================================
        # STEP 1: Fill Ada/Parsel and İmar
        # ============================================================
        print("\n3. STEP 1 - Filling Parsel & İmar...")

        # Select ilce
        page.locator('select#ilce').select_option('kepez')
        page.locator('input#ada').fill('6960')
        page.locator('input#parsel').fill('4')
        print("   ✓ Filled Ada/Parsel: Kepez, 6960/4")

        # Click TKGM lookup
        tkgm_btn = page.locator('button:has-text("TKGM")').first
        tkgm_btn.click()
        page.wait_for_timeout(2000)
        print("   ✓ TKGM lookup completed")

        # Fill İmar fields
        # IMPORTANT: DecimalInput only parses values on blur, not during typing
        # So we must call blur() after each fill() to trigger value parsing
        # Also, auto-submit may trigger when TAKS+KAKS are filled, so fill Çıkma FIRST
        inputs = page.locator('input[type="text"]').all()
        visible_inputs = [inp for inp in inputs if inp.is_visible()]
        print(f"   Found {len(visible_inputs)} visible inputs for İmar")

        # Fill Çıkma FIRST (before TAKS/KAKS which may trigger auto-submit)
        for inp in visible_inputs:
            placeholder = inp.get_attribute('placeholder') or ''
            if '1.60' in placeholder or '1,60' in placeholder:
                inp.fill('1.70')
                inp.blur()  # Trigger value parsing
                print("   ✓ Filled Çıkma: 1.70 (with blur)")
                break

        page.wait_for_timeout(200)  # Let blur handler process

        # Fill TAKS (with blur to trigger parsing)
        for inp in visible_inputs:
            placeholder = inp.get_attribute('placeholder') or ''
            if '0.3' in placeholder or '0,3' in placeholder:
                inp.fill('0.30')
                inp.blur()  # Trigger value parsing
                print("   ✓ Filled TAKS: 0.30 (with blur)")
                break

        page.wait_for_timeout(200)  # Let blur handler process

        # Fill KAKS (with blur - this may trigger auto-submit)
        for inp in visible_inputs:
            placeholder = inp.get_attribute('placeholder') or ''
            if '0.6' in placeholder or '0,6' in placeholder:
                inp.fill('0.60')
                inp.blur()  # Trigger value parsing
                print("   ✓ Filled KAKS: 0.60 (with blur)")
                break

        page.wait_for_timeout(500)  # Wait for potential auto-submit

        # ============================================================
        # BUG #1: Check if "Sonraki Adım" is enabled
        # ============================================================
        print("\n4. BUG TEST #1 - Navigation button state...")

        next_btn = page.locator('button:has-text("Sonraki")').first
        next_disabled = next_btn.is_disabled()

        if next_disabled:
            bugs_found.append("BUG #1: 'Sonraki Adım' button is disabled after filling İmar")
            print("   ✗ BUG #1 CONFIRMED: Button is disabled!")
            page.screenshot(path='/tmp/bug1_navigation.png', full_page=True)
            browser.close()
            return bugs_found
        else:
            print("   ✓ BUG #1 NOT PRESENT: Button is enabled")

        # Go to Step 2
        next_btn.click()
        page.wait_for_timeout(1000)
        print("   ✓ Navigated to Step 2")

        # ============================================================
        # STEP 2: Unit Mix
        # ============================================================
        print("\n5. STEP 2 - Unit Mix...")

        # Check if Step 2 loaded with area info
        page_content = page.content()
        if 'Kullanılabilir' in page_content or 'Kalan' in page_content:
            print("   ✓ Step 2 shows area information")
        else:
            print("   ⚠ Step 2 may be missing area information")

        # Just proceed - the default mix should be pre-filled
        page.wait_for_timeout(500)
        next_btn = page.locator('button:has-text("Sonraki")').first

        if next_btn.is_disabled():
            print("   ⚠ Step 2 next button is disabled - checking unit mix")
            page.screenshot(path='/tmp/step2_disabled.png', full_page=True)
            bugs_found.append("BUG: Step 2 'Sonraki Adım' is disabled")
        else:
            next_btn.click()
            page.wait_for_timeout(1000)
            print("   ✓ Navigated to Step 3")

        page.screenshot(path='/tmp/step3.png', full_page=True)

        # ============================================================
        # STEP 3: Cost & Pricing - BUG #2 CHECK
        # ============================================================
        print("\n6. STEP 3 - Cost & Pricing (BUG TEST #2 - Data Flow)...")

        # Check if Step 1 data appears in Step 3
        page_text = page.inner_text('body')

        # Look for parsel area (2,146 m² or 2.146)
        has_parsel_area = '2.146' in page_text or '2,146' in page_text or '2146' in page_text
        if has_parsel_area:
            print("   ✓ Parsel area (2146) found in Step 3")
        else:
            bugs_found.append("BUG #2: Step 1 parsel area not visible in Step 3")
            print("   ✗ BUG #2: Parsel area NOT found in Step 3")

        # Check for TAKS value
        has_taks = '0.30' in page_text or '0,30' in page_text
        if has_taks:
            print("   ✓ TAKS (0.30) found in Step 3")
        else:
            print("   ⚠ TAKS not found in Step 3 text")

        # Check for Çıkma value
        has_cikma = '1.70' in page_text or '1,70' in page_text
        if has_cikma:
            print("   ✓ Çıkma (1.70) found in Step 3")
        else:
            print("   ⚠ Çıkma not found in Step 3 text")

        # ============================================================
        # BUG #3: Check for floating point errors
        # ============================================================
        print("\n7. BUG TEST #3 - Decimal display formatting...")

        # Look for numbers with excessive decimal places
        decimal_pattern = r'\d+\.\d{4,}'  # 4 or more decimal places
        bad_decimals = re.findall(decimal_pattern, page_text)

        if bad_decimals:
            unique_bad = list(set(bad_decimals))[:5]  # First 5 unique
            bugs_found.append(f"BUG #3: Excessive decimals found: {unique_bad}")
            print(f"   ✗ BUG #3 CONFIRMED: Found excessive decimals: {unique_bad}")
        else:
            print("   ✓ BUG #3 NOT PRESENT: No excessive decimal places found")

        # Check for specific values like 1.70
        if '1.70' in page_text or '1,70' in page_text:
            print("   ✓ Çıkma (1.70) displayed correctly")
        else:
            # Check if it shows as 1.7000000000002 or similar
            cikma_pattern = r'1[.,]7\d{3,}'
            bad_cikma = re.findall(cikma_pattern, page_text)
            if bad_cikma:
                bugs_found.append(f"BUG #3: Çıkma shows as {bad_cikma[0]} instead of 1.70")
                print(f"   ✗ BUG #3: Çıkma displayed incorrectly: {bad_cikma[0]}")

        # Take screenshot
        page.screenshot(path='/tmp/step3_data.png', full_page=True)

        # Continue to Step 4
        # Note: With auto-submit after İmar entry, we may already be on Step 4
        page.wait_for_timeout(500)

        # Check if we're already on Step 4 by looking for "Adım 4" or "Finansal Analiz"
        page_text = page.inner_text('body')
        if 'Adım 4' in page_text or 'Finansal Analiz' in page_text:
            print("   ✓ Already on Step 4 (auto-advanced)")
        else:
            try:
                next_btn = page.locator('button:has-text("Sonraki")').first
                if next_btn.is_visible(timeout=3000) and not next_btn.is_disabled(timeout=3000):
                    next_btn.click()
                    page.wait_for_timeout(1000)
                    print("   ✓ Navigated to Step 4")
                else:
                    print("   ⚠ Step 3 next button is disabled or not visible")
                    bugs_found.append("BUG: Step 3 'Sonraki Adım' is disabled")
            except Exception as e:
                print(f"   ⚠ Step 3 navigation error: {str(e)[:50]}")

        # ============================================================
        # STEP 4: Financial Summary - Final checks
        # ============================================================
        print("\n8. STEP 4 - Financial Summary...")
        page.screenshot(path='/tmp/step4.png', full_page=True)

        page_text = page.inner_text('body')

        # Check if financial numbers are displayed
        if 'TL' in page_text or 'Toplam' in page_text:
            print("   ✓ Financial summary shows TL values")
        else:
            print("   ⚠ Financial summary may be incomplete")

        # Check for Step 1 data in Step 4
        has_parsel_in_step4 = '2.146' in page_text or '2,146' in page_text or '2146' in page_text
        if has_parsel_in_step4:
            print("   ✓ Parsel area (2146) found in Step 4")
        else:
            print("   ⚠ Parsel area not displayed in Step 4")

        # Final decimal check
        bad_decimals = re.findall(r'\d+\.\d{4,}', page_text)
        if bad_decimals:
            unique_bad = list(set(bad_decimals))[:5]
            bugs_found.append(f"BUG #3 (Step 4): Excessive decimals: {unique_bad}")
            print(f"   ✗ BUG #3 in Step 4: Excessive decimals: {unique_bad}")
        else:
            print("   ✓ No excessive decimals in Step 4")

        browser.close()

        # ============================================================
        # SUMMARY
        # ============================================================
        print("\n" + "=" * 70)
        print("TEST SUMMARY")
        print("=" * 70)

        if bugs_found:
            print(f"\n❌ BUGS FOUND ({len(bugs_found)}):")
            for bug in bugs_found:
                print(f"   • {bug}")
        else:
            print("\n✅ ALL TESTS PASSED - No bugs found!")

        print("\nScreenshots saved to /tmp/step*.png")
        print("=" * 70)

        return bugs_found

if __name__ == "__main__":
    test_complete_flow()
