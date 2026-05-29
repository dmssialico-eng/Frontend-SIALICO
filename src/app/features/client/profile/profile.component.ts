/**
 * ProfileComponent
 *
 * Allows the user to update their display name, company name, and phone number.
 * Phone input is handled with a custom country-code picker and a digit mask
 * that formats the number as "XXX XXX XXXX" on screen while storing only the
 * raw digits in the form control.
 *
 * After a successful save, `AuthService.me()` is called to refresh the in-memory
 * user state so the sidebar and top bar reflect any name changes immediately.
 *
 * Route: /profile — protected by authGuard.
 * Depends on: UserService, AuthService.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { User } from '../../../shared/models/models';

/** Represents an entry in the country-code picker dropdown. */
export interface CountryCode {
  name: string;
  /** E.164 country calling code including the leading '+'. */
  code: string;
  flag: string;
  /** Expected local number length for this country; used by the digit validator. */
  digits: number;
}

/**
 * Custom validator that enforces exactly 10 digits for the local phone number.
 * The field is optional — an empty value passes validation.
 */
function phoneDigitsValidator(ctrl: AbstractControl): ValidationErrors | null {
  const val: string = ctrl.value ?? '';
  if (!val) return null;
  if (/[^0-9]/.test(val)) return { hasLetters: true };
  if (val.length !== 10) return { wrongLength: true };
  return null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PrimaryButtonComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  /** The currently authenticated user; read from AuthService cache on init. */
  user: User | null = null;
  profileForm!: FormGroup;
  /** True while the profile PATCH request is in flight. */
  isSaving       = false;
  successMessage = '';
  errorMessage   = '';

  /** Controls visibility of the country-code picker dropdown. */
  showLadaDropdown = false;
  /** Text filter for searching within the country-code picker. */
  ladaSearch       = '';
  /** Absolute pixel position of the dropdown, calculated relative to the trigger button. */
  dropdownTop      = 0;
  dropdownLeft     = 0;

  readonly countryCodes: CountryCode[] = [
    { name: 'México',         code: '+52',  flag: '🇲🇽', digits: 10 },
    { name: 'Estados Unidos', code: '+1',   flag: '🇺🇸', digits: 10 },
    { name: 'Canadá',         code: '+1',   flag: '🇨🇦', digits: 10 },
    { name: 'España',         code: '+34',  flag: '🇪🇸', digits: 9  },
    { name: 'Argentina',      code: '+54',  flag: '🇦🇷', digits: 10 },
    { name: 'Colombia',       code: '+57',  flag: '🇨🇴', digits: 10 },
    { name: 'Chile',          code: '+56',  flag: '🇨🇱', digits: 9  },
    { name: 'Brasil',         code: '+55',  flag: '🇧🇷', digits: 11 },
    { name: 'Perú',           code: '+51',  flag: '🇵🇪', digits: 9  },
    { name: 'Francia',        code: '+33',  flag: '🇫🇷', digits: 9  },
    { name: 'Alemania',       code: '+49',  flag: '🇩🇪', digits: 10 },
    { name: 'Reino Unido',    code: '+44',  flag: '🇬🇧', digits: 10 },
    { name: 'Italia',         code: '+39',  flag: '🇮🇹', digits: 10 },
    { name: 'China',          code: '+86',  flag: '🇨🇳', digits: 11 },
    { name: 'Japón',          code: '+81',  flag: '🇯🇵', digits: 10 },
  ];

  /** Currently selected country code; defaults to México (+52). */
  selectedCountry: CountryCode = this.countryCodes[0];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();

    const rawPhone: string = this.user?.phone ?? '';
    const { country, localNumber } = this.parseStoredPhone(rawPhone);
    this.selectedCountry = country;

    this.profileForm = this.fb.group({
      full_name:    [this.user?.full_name    ?? '', Validators.required],
      company_name: [this.user?.company_name ?? ''],
      phone:        [localNumber, phoneDigitsValidator],
    });
  }


  /** Filters the country list by name or calling code for the search input. */
  get filteredCountries(): CountryCode[] {
    const q = this.ladaSearch.toLowerCase();
    if (!q) return this.countryCodes;
    return this.countryCodes.filter(c =>
      c.name.toLowerCase().includes(q) || c.code.includes(q)
    );
  }

  /** Selects a country code and forces revalidation of the phone field. */
  selectCountry(country: CountryCode): void {
    this.selectedCountry = country;
    this.showLadaDropdown = false;
    this.ladaSearch = '';
    this.profileForm.get('phone')?.updateValueAndValidity();
  }

  /**
   * Calculates the dropdown's absolute position relative to the trigger button
   * so it appears directly below it regardless of scroll position.
   */
  toggleDropdown(event: MouseEvent): void {
    this.showLadaDropdown = !this.showLadaDropdown;
    if (this.showLadaDropdown) {
      const btn  = (event.currentTarget as HTMLElement);
      const rect = btn.getBoundingClientRect();
      this.dropdownTop  = rect.bottom + 4;
      this.dropdownLeft = rect.left;
      setTimeout(() => document.getElementById('lada-search')?.focus(), 50);
    }
  }

  closeDropdown(): void {
    this.showLadaDropdown = false;
    this.ladaSearch = '';
  }

  /**
   * Strips non-digit characters, caps at 10 digits, applies the visual mask,
   * and writes the raw digit string back to the form control.
   * The visual mask and the form value are intentionally kept in sync separately
   * to preserve a clean value for the API payload.
   */
  onPhoneInput(event: Event): void {
    const input  = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '');
    const capped = digits.slice(0, 10);
    const masked = this.applyMask(capped);
    input.value  = masked;
    this.profileForm.get('phone')!.setValue(capped, { emitEvent: true });
    this.profileForm.get('phone')!.markAsTouched();
  }

  /** Blocks non-digit keys at the keyboard level to prevent garbage characters from being typed. */
  onPhoneKeydown(event: KeyboardEvent): void {
    const allowed = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];
    if (allowed.includes(event.key)) return;
    if (!/^\d$/.test(event.key)) event.preventDefault();
  }

  /** Formats a raw digit string as "XXX XXX XXXX" for display purposes. */
  private applyMask(digits: string): string {
    const d = digits.padEnd(0, '');
    let result = '';
    if (d.length > 0) result += d.slice(0, 3);
    if (d.length > 3) result += ' ' + d.slice(3, 6);
    if (d.length > 6) result += ' ' + d.slice(6, 10);
    return result;
  }

  /** Returns the formatted phone number for display in read-only contexts. */
  get maskedPhone(): string {
    const raw = this.profileForm?.get('phone')?.value ?? '';
    return this.applyMask(raw);
  }

  /** Returns the first applicable validation error message, or null when the field is valid. */
  get phoneError(): string | null {
    const ctrl = this.profileForm.get('phone');
    if (!ctrl || !ctrl.touched || ctrl.valid) return null;
    if (ctrl.errors?.['hasLetters'])  return 'El teléfono solo puede contener números.';
    if (ctrl.errors?.['wrongLength']) return 'Ingresa exactamente 10 dígitos.';
    return null;
  }

  /**
   * Combines the selected country code with the local digit string before sending
   * to the API (e.g. "+52 5512345678"). Calls AuthService.me() after success so
   * the in-memory user state reflects the new name in the sidebar immediately.
   */
  saveChanges() {
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid || this.isSaving) return;

    this.isSaving       = true;
    this.successMessage = '';
    this.errorMessage   = '';

    const localPhone: string = this.profileForm.get('phone')!.value ?? '';
    const fullPhone = localPhone ? `${this.selectedCountry.code} ${localPhone}` : '';

    const payload = {
      full_name:    this.profileForm.get('full_name')!.value,
      company_name: this.profileForm.get('company_name')!.value,
      phone:        fullPhone,
    };

    this.userService.updateProfile(payload).subscribe({
      next: () => {
        this.authService.me().subscribe();
        this.successMessage = 'Perfil actualizado correctamente.';
        this.isSaving = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo actualizar el perfil. Intenta de nuevo.';
        this.isSaving = false;
      }
    });
  }

  /** Calls AuthService.logout() then redirects to the login page. */
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Parses a stored phone string back into a country code and local number.
   * Tries country codes longest-first to avoid a shorter code (e.g. "+1") matching
   * a number that starts with a longer one (e.g. "+1 800…").
   * Falls back to México with a cleaned digit string when no match is found.
   */
  private parseStoredPhone(raw: string): { country: CountryCode; localNumber: string } {
    if (!raw) return { country: this.countryCodes[0], localNumber: '' };

    const sorted = [...this.countryCodes].sort((a, b) => b.code.length - a.code.length);
    for (const c of sorted) {
      if (raw.startsWith(c.code)) {
        const local = raw.slice(c.code.length).replace(/\D/g, '');
        return { country: c, localNumber: local };
      }
    }

    return { country: this.countryCodes[0], localNumber: raw.replace(/\D/g, '').slice(0, 10) };
  }
}