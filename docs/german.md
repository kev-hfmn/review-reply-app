# Multi-Language AI Reply Generation Implementation Plan

## Overview
Add support for generating AI replies in multiple languages (starting with German) while keeping the platform interface in English. This enables international expansion, particularly for German markets, where businesses can receive authentic, culturally appropriate replies in their local language.

## Research Findings

### Current System Analysis
- **AI Service**: Uses OpenAI GPT-4o-mini via `/api/ai/generate-reply` route
- **Brand Voice**: Stored in `business_settings` table with customizable tone settings
- **Prompt Engineering**: Dynamic system prompts built in `buildSystemPrompt()` function
- **Fallback System**: Template-based replies for offline scenarios in 3 tones
- **Settings UI**: Existing Brand Voice tab in Settings page for customization

### Technical Feasibility
 **Database**: `business_settings` table can accommodate new language field  
 **AI Integration**: OpenAI GPT-4 has excellent multilingual capabilities  
 **UI Framework**: Settings page already has extensible Brand Voice section  
 **Prompt System**: Dynamic prompt building supports language instructions  
 **Fallback System**: Template system can be extended for multiple languages  

## Implementation Plan

### Phase 1: Database Schema Extension

#### 1.1 Create Migration File
**File**: `docs/migrations/add_reply_language.sql`
```sql
-- Migration: Add reply language support to business_settings
-- Allows businesses to set their preferred language for AI-generated replies

ALTER TABLE business_settings 
ADD COLUMN reply_language TEXT DEFAULT 'en' 
CHECK (reply_language IN ('en', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'sv', 'da', 'no'));

-- Add index for language-based queries
CREATE INDEX IF NOT EXISTS idx_business_settings_reply_language 
ON business_settings (reply_language);

-- Add comment for documentation
COMMENT ON COLUMN business_settings.reply_language IS 'Language code for AI-generated replies (ISO 639-1 format)';
```

#### 1.2 Update Schema Documentation
**Files to update**:
- `docs/flowrise-schema.sql` - Add the new column to main schema
- `docs/database-schema.sql` - Add to backup schema file
- Update any schema documentation or type definitions

#### 1.3 Apply Migration
- Run migration on development database
- Test that existing records default to 'en'
- Verify constraint validation works

### Phase 2: TypeScript Type Definitions

#### 2.1 Update Interface Definitions
**File**: `lib/services/aiReplyService.ts`
```typescript
export interface BrandVoiceSettings {
  preset: 'friendly' | 'professional' | 'playful' | 'custom';
  formality: number;
  warmth: number;
  brevity: number;
  customInstruction?: string;
  replyLanguage?: string; // Add this field
}
```

#### 2.2 Update Database Query Functions
**File**: `lib/services/aiReplyService.ts` - Update `getBusinessSettings()`
```typescript
const { data, error } = await supabase
  .from('business_settings')
  .select('brand_voice_preset, formality_level, warmth_level, brevity_level, custom_instruction, reply_language')
  .eq('business_id', businessId)
  .single();

return {
  preset: data.brand_voice_preset,
  formality: data.formality_level,
  warmth: data.warmth_level,
  brevity: data.brevity_level,
  customInstruction: data.custom_instruction,
  replyLanguage: data.reply_language || 'en', // Default fallback
};
```

### Phase 3: Language Configuration

#### 3.1 Create Language Configuration File
**File**: `lib/config/languages.ts`
```typescript
export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  region: string;
  culturalNotes?: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    region: 'Global'
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    region: 'Germany, Austria, Switzerland',
    culturalNotes: 'Prefer formal address (Sie) in business contexts, direct communication style'
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    region: 'France, Belgium, Switzerland'
  },
  // Add more languages as needed
];

export const getLanguageConfig = (code: string): LanguageConfig | undefined => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
};
```

#### 3.2 Create Language-Specific Prompt Templates
**File**: `lib/config/languagePrompts.ts`
```typescript
export const LANGUAGE_INSTRUCTIONS = {
  en: "Write your reply in English using natural, conversational language.",
  de: "WICHTIG: Schreiben Sie Ihre Antwort auf Deutsch. Verwenden Sie natürliche, authentische deutsche Ausdrücke und einen angemessenen Geschäftston. Nutzen Sie 'Sie' für formelle Ansprache.",
  fr: "IMPORTANT: Rédigez votre réponse en français en utilisant des expressions naturelles et un ton commercial approprié.",
  // Add more languages
};

export const CULTURAL_CONTEXT = {
  en: "Use friendly, professional tone appropriate for English-speaking business culture.",
  de: "German business culture values directness, formality, and precision. Use polite but straightforward language.",
  fr: "French business culture appreciates politeness and proper formality. Use respectful, well-structured language.",
  // Add more languages
};
```

### Phase 4: AI Prompt Enhancement

#### 4.1 Update System Prompt Builder
**File**: `app/api/ai/generate-reply/route.ts`

Modify `buildSystemPrompt()` function:
```typescript
function buildSystemPrompt(brandVoice: BrandVoiceSettings, businessInfo: BusinessInfo) {
  const { preset, formality, warmth, brevity, customInstruction, replyLanguage = 'en' } = brandVoice;
  
  // ... existing prompt building logic ...
  
  // Add language-specific instructions
  const languageInstruction = LANGUAGE_INSTRUCTIONS[replyLanguage] || LANGUAGE_INSTRUCTIONS.en;
  const culturalContext = CULTURAL_CONTEXT[replyLanguage] || CULTURAL_CONTEXT.en;
  
  basePrompt += `\n\nLANGUAGE: ${languageInstruction}`;
  basePrompt += `\n\nCULTURAL CONTEXT: ${culturalContext}`;
  
  // Add language-specific forbidden words if needed
  if (replyLanguage !== 'en') {
    basePrompt += `\n\nWrite naturally in ${replyLanguage} - avoid obvious translations or English phrases.`;
  }
  
  return basePrompt;
}
```

#### 4.2 Update User Prompt Builder
Consider adding language context to review prompt:
```typescript
function buildUserPrompt(review: ReviewData, language: string = 'en') {
  const languageNote = language !== 'en' 
    ? `\n\nIMPORTANT: Reply in ${getLanguageConfig(language)?.nativeName || language}.`
    : '';
    
  return `Please write a reply to this ${review.rating}-star review from ${review.customerName}:

"${review.text}"

Your reply should be appropriate for the rating, acknowledge their feedback, and thank them for their business.${languageNote}`;
}
```

### Phase 5: Template Fallback Localization

#### 5.1 Create Multilingual Templates
**File**: `lib/config/templates.ts`
```typescript
export const LOCALIZED_TEMPLATES = {
  en: {
    friendly: {
      5: (name: string) => `Thank you so much, ${name}! We're thrilled you had such a wonderful experience with us...`,
      // ... existing English templates
    },
    // ... other English tones
  },
  de: {
    friendly: {
      5: (name: string) => `Vielen Dank, ${name}! Wir freuen uns sehr, dass Sie eine so wunderbare Erfahrung bei uns gemacht haben...`,
      4: (name: string) => `Vielen Dank für Ihre positive Bewertung, ${name}! Wir freuen uns, dass Ihnen unser Service gefallen hat...`,
      3: (name: string) => `Hallo ${name}, vielen Dank für Ihr Feedback. Wir freuen uns, dass Sie eine angemessene Erfahrung hatten...`,
      2: (name: string) => `Hallo ${name}, vielen Dank für Ihr ehrliches Feedback. Es tut uns leid, dass wir Ihre Erwartungen nicht erfüllt haben...`,
      1: (name: string) => `${name}, es tut uns wirklich leid wegen Ihrer Erfahrung. Das entspricht nicht unseren Standards...`
    },
    professional: {
      5: (name: string) => `Sehr geehrte/r ${name}, wir bedanken uns herzlich für Ihre ausgezeichnete Bewertung...`,
      // ... more German professional templates
    },
    playful: {
      5: (name: string) => `Wow, ${name}! Sie haben unser ganzes Team zum Freudentanz gebracht! <‰ Vielen Dank für die fantastische Bewertung...`,
      // ... more German playful templates
    }
  }
  // Add more languages
};
```

#### 5.2 Update Fallback Logic
**File**: `lib/services/aiReplyService.ts`
```typescript
function getFallbackReply(review: ReviewData, tone: string = 'friendly', language: string = 'en'): string {
  const languageTemplates = LOCALIZED_TEMPLATES[language] || LOCALIZED_TEMPLATES.en;
  const templates = languageTemplates[tone as keyof typeof languageTemplates] || languageTemplates.friendly;
  const ratingKey = review.rating as keyof typeof templates;
  const template = templates[ratingKey] || templates[3];
  
  return template(review.customerName);
}
```

### Phase 6: Settings UI Implementation

#### 6.1 Add Language Selector Component
**File**: `components/ui/language-selector.tsx`
```tsx
interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
  disabled?: boolean;
}

export function LanguageSelector({ value, onChange, disabled }: LanguageSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="reply-language">Reply Language</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Select language for AI replies" />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{lang.nativeName}</span>
                <span className="text-sm text-muted-foreground">({lang.name})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        AI-generated replies will be written in this language. The platform interface remains in English.
      </p>
    </div>
  );
}
```

#### 6.2 Update Settings Page
**File**: `app/(app)/settings/page.tsx`

Add to Brand Voice tab:
```tsx
// Add state for language
const [replyLanguage, setReplyLanguage] = useState('en');

// Add to form save handler
const handleSaveBrandVoice = async () => {
  // ... existing save logic ...
  
  const { error } = await supabase
    .from('business_settings')
    .update({
      // ... existing fields ...
      reply_language: replyLanguage,
    })
    .eq('business_id', businessId);
};

// Add to JSX in Brand Voice tab
<div className="space-y-6">
  {/* Existing voice preset selector */}
  
  {/* Add language selector */}
  <LanguageSelector 
    value={replyLanguage}
    onChange={setReplyLanguage}
    disabled={isSaving}
  />
  
  {/* Existing sliders and custom instruction */}
</div>
```

#### 6.3 Add Language Preview
Show example replies in selected language:
```tsx
<div className="mt-4 p-4 border rounded-lg bg-muted/50">
  <h4 className="font-medium mb-2">Preview</h4>
  <p className="text-sm text-muted-foreground mb-2">
    Example 5-star reply in {getLanguageConfig(replyLanguage)?.nativeName}:
  </p>
  <p className="text-sm italic">
    {getExampleReply(replyLanguage, brandVoicePreset, 5)}
  </p>
</div>
```

### Phase 7: Testing & Quality Assurance

#### 7.1 Unit Tests
**File**: `__tests__/language-support.test.ts`
- Test language configuration loading
- Test prompt building with different languages
- Test template fallback system
- Test database operations with language field

#### 7.2 Integration Tests
- Test full AI reply generation flow in German
- Test settings page language selection
- Test database migration and rollback
- Test error handling with unsupported languages

#### 7.3 Manual Testing Checklist
- [ ] Language selector appears and functions in Settings
- [ ] German language selection saves to database
- [ ] AI generates authentic German replies
- [ ] Fallback templates work in German
- [ ] Cultural appropriateness of German replies
- [ ] Special characters (ä, ö, ü, ß) handled correctly
- [ ] Existing English functionality unchanged
- [ ] Error handling for invalid language codes

### Phase 8: Documentation & Deployment

#### 8.1 Update Documentation
- Update README with language support information
- Document language configuration for new deployments
- Add migration instructions
- Update API documentation if exposing language endpoints

#### 8.2 Environment Configuration
- Ensure no additional environment variables needed
- Verify OpenAI API usage patterns don't change significantly
- Document any increased token usage from multilingual prompts

#### 8.3 Deployment Steps
1. Apply database migration
2. Deploy code changes
3. Test in staging environment with German examples
4. Monitor AI reply quality and user feedback
5. Gradually roll out to interested German businesses

## Dependencies & Prerequisites

### Technical Dependencies
-  OpenAI API access (already configured)
-  Supabase database (already configured)
-  Existing Settings UI framework
-  TypeScript support for interface updates

### Migration Dependencies
- Database migration must be applied before code deployment
- Existing business_settings records will default to 'en'
- No breaking changes to existing functionality

### Language Quality Dependencies
- German language validation by native speaker
- Cultural appropriateness review for business contexts
- Template quality assurance for professional tone

## Success Metrics

### Technical Metrics
- [ ] All existing English functionality unchanged
- [ ] Database migration completes without errors
- [ ] Language selection UI functions correctly
- [ ] AI reply generation works in German

### Quality Metrics
- [ ] German replies sound natural and authentic
- [ ] Cultural appropriateness maintained
- [ ] Business tone appropriate for German market
- [ ] No English phrases in German replies

### User Experience Metrics
- [ ] Settings UI remains intuitive
- [ ] Language selection process is clear
- [ ] Preview functionality helps users understand changes
- [ ] Error messages are helpful and clear

## Future Enhancements

### Additional Languages
- French (fr) - France, Belgium, Switzerland markets
- Spanish (es) - Spain, Latin America markets  
- Italian (it) - Italy market
- Dutch (nl) - Netherlands, Belgium markets

### Advanced Features
- Regional language variants (e.g., Austrian German vs. German German)
- Industry-specific language templates
- A/B testing for different language approaches
- Language auto-detection from business location

### Integration Enhancements
- Bulk language migration for existing businesses
- Language analytics and usage reporting
- Customer language preference detection
- Multi-language digest reports

## Risk Mitigation

### Technical Risks
- **Risk**: AI quality degradation in non-English languages
- **Mitigation**: Extensive testing, template fallbacks, gradual rollout

- **Risk**: Increased OpenAI API costs due to longer prompts
- **Mitigation**: Monitor usage, optimize prompts, set reasonable limits

### Business Risks
- **Risk**: Cultural inappropriateness in German replies
- **Mitigation**: Native speaker review, cultural context guidelines

- **Risk**: Customer confusion about language settings
- **Mitigation**: Clear UI labels, preview functionality, help documentation

### Deployment Risks
- **Risk**: Database migration issues
- **Mitigation**: Test migration thoroughly, have rollback plan

- **Risk**: Breaking existing functionality
- **Mitigation**: Comprehensive testing, feature flags for gradual rollout