import { Component, Input } from '@angular/core';
import { ContactInfo } from '../../../../core/models/instagram.models';

@Component({
  selector: 'app-contact-info',
  standalone: true,
  template: `
    @if (hasContactInfo()) {
      <div class="contact-info">
        @for (email of contacts.emails; track email) {
          <div class="contact-item">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            <a [href]="'mailto:' + email" class="contact-link">{{ email }}</a>
          </div>
        }
        @for (phone of contacts.phones; track phone) {
          <div class="contact-item">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
            <a [href]="'tel:' + phone" class="contact-link">{{ phone }}</a>
          </div>
        }
        @for (link of contacts.socialLinks; track link.url) {
          <div class="contact-item">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
            </svg>
            <a [href]="link.url" class="contact-link" target="_blank" rel="noopener">
              {{ link.platform }}: {{ link.username || link.url }}
            </a>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      padding: 8px 0 16px;
      border-bottom: 1px solid var(--border-color, #efefef);
      margin-bottom: 8px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text-secondary, #8e8e8e);
    }

    .contact-link {
      color: var(--link-color, #00376b);
      text-decoration: none;
      font-weight: 500;

      &:hover {
        text-decoration: underline;
      }
    }

    @media (max-width: 735px) {
      .contact-info {
        padding: 8px 16px 16px;
      }
    }
  `],
})
export class ContactInfoComponent {
  @Input() contacts: ContactInfo = { emails: [], phones: [], socialLinks: [] };

  hasContactInfo(): boolean {
    return (
      this.contacts.emails.length > 0 ||
      this.contacts.phones.length > 0 ||
      this.contacts.socialLinks.length > 0
    );
  }
}
