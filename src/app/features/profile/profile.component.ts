import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { User } from '../../core/models/models';

export interface CountryCode {
  name: string;
  code: string;  
  flag: string;  
  digits: number; 
}

function phoneDigitsValidator(ctrl: AbstractControl): ValidationErrors | null {
  const val: string = ctrl.value ?? '';
  if (!val) return null; // campo opcional — si está vacío es válido
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
  user: User | null = null;
  profileForm!: FormGroup;
  isSaving      = false;
  successMessage = '';
  errorMessage   = '';

  showLadaDropdown = false;
  ladaSearch       = '';
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

  selectedCountry: CountryCode = this.countryCodes[0]; // México por defecto

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


  get filteredCountries(): CountryCode[] {
    const q = this.ladaSearch.toLowerCase();
    if (!q) return this.countryCodes;
    return this.countryCodes.filter(c =>
      c.name.toLowerCase().includes(q) || c.code.includes(q)
    );
  }

  selectCountry(country: CountryCode): void {
    this.selectedCountry = country;
    this.showLadaDropdown = false;
    this.ladaSearch = '';
    this.profileForm.get('phone')?.updateValueAndValidity();
  }

  toggleDropdown(event: MouseEvent): void {
    this.showLadaDropdown = !this.showLadaDropdown;
    if (this.showLadaDropdown) {
      const btn = (event.currentTarget as HTMLElement);
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

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '');
    const capped = digits.slice(0, 10);
    const masked = this.applyMask(capped);
    input.value = masked;
    this.profileForm.get('phone')!.setValue(capped, { emitEvent: true });
    this.profileForm.get('phone')!.markAsTouched();
  }

  onPhoneKeydown(event: KeyboardEvent): void {
    const allowed = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];
    if (allowed.includes(event.key)) return;
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  private applyMask(digits: string): string {
    const d = digits.padEnd(0, '');
    let result = '';
    if (d.length > 0) result += d.slice(0, 3);
    if (d.length > 3) result += ' ' + d.slice(3, 6);
    if (d.length > 6) result += ' ' + d.slice(6, 10);
    return result;
  }

  get maskedPhone(): string {
    const raw = this.profileForm?.get('phone')?.value ?? '';
    return this.applyMask(raw);
  }

  get phoneError(): string | null {
    const ctrl = this.profileForm.get('phone');
    if (!ctrl || !ctrl.touched || ctrl.valid) return null;
    if (ctrl.errors?.['hasLetters'])   return 'El teléfono solo puede contener números.';
    if (ctrl.errors?.['wrongLength'])  return `Ingresa exactamente 10 dígitos.`;
    return null;
  }

  saveChanges() {
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid || this.isSaving) return;

    this.isSaving      = true;
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

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private parseStoredPhone(raw: string): { country: CountryCode; localNumber: string } {
    if (!raw) return { country: this.countryCodes[0], localNumber: '' };

    // Buscar si empieza con alguna lada conocida (de más larga a más corta)
    const sorted = [...this.countryCodes].sort((a, b) => b.code.length - a.code.length);
    for (const c of sorted) {
      if (raw.startsWith(c.code)) {
        const local = raw.slice(c.code.length).replace(/\D/g, '');
        return { country: c, localNumber: local };
      }
    }

    // Sin lada reconocible — quedarse con México y el número limpio
    return { country: this.countryCodes[0], localNumber: raw.replace(/\D/g, '').slice(0, 10) };
  }
}