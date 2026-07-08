export type PriceVerificationStatus = "official-confirmed" | "secondary-confirmed" | "unresolved" | string;

export type ReviewDecisionValue = "unreviewed" | "register" | "needs_revision" | "hold" | "exclude";
export type ImageReviewValue = "confirmed" | "incorrect" | "unresolved" | "no-image" | "candidate-only";
export type LegacyImageReviewValue = "verified" | "wrong" | "unconfirmed" | "no_image_planned";
export type ImageCandidateSourceType = "official-usj" | "official-press" | "official-restaurant" | "official-event" | "secondary" | "unknown" | string;
export type TargetType = "new" | "existing";
export type DuplicateAction =
  | "new_manual_food"
  | "collection_add"
  | "override_add"
  | "variant_add"
  | "publication_metadata_add"
  | "existing_update"
  | "exclude"
  | "needs_review";

export type ReviewItem = {
  id: string;
  reviewStatus: "pending" | "draft" | "approved" | string;
  name: string;
  normalizedName?: string | null;
  category?: string | null;
  collectionId?: string | null;
  price?: number | null;
  priceText?: string | null;
  priceSource?: string | null;
  priceVariants?: ReviewPriceVariant[];
  shopName?: string | null;
  shopOfficialUrl?: string | null;
  areaName?: string | null;
  diningType?: string | null;
  takeoutAvailable?: boolean | null;
  description?: string | null;
  saleStartDate?: string | null;
  saleEndDate?: string | null;
  eventStartDate?: string | null;
  eventEndDate?: string | null;
  saleTimeCondition?: string | null;
  sourceUrl?: string | null;
  officialReferenceUrls?: string[];
  lastCheckedAt?: string | null;
  imageUrl?: string | null;
  imageSourceUrl?: string | null;
  imageCandidates?: ReviewImageCandidate[];
  imageReviewStatus?: ImageReviewValue | LegacyImageReviewValue | string | null;
  imageReviewNote?: string | null;
  imageCheckedAt?: string | null;
  unconfirmedFields?: string[];
  duplicateCandidates?: Array<{
    source?: string | null;
    id?: string | null;
    foodId?: string | null;
    name?: string | null;
    canonicalGroupId?: string | null;
    reason?: string | null;
    decision?: string | null;
  }>;
  dedupeNotes?: string | null;
  priceVerification?: {
    status?: PriceVerificationStatus;
    sourceType?: string | null;
    note?: string | null;
  };
  importReview?: {
    isExisting?: boolean;
    useFoodId?: string | null;
    plannedFoodId?: string | null;
    canonicalGroupId?: string | null;
    duplicateHandling?: string | null;
    registrationTarget?: string | null;
    registrationPolicy?: string | null;
    needsHumanReview?: boolean;
    notes?: string | null;
  };
};

export type ReviewPriceVariant = {
  label?: string | null;
  price?: number | null;
  priceText?: string | null;
  source?: string | null;
  note?: string | null;
};

export type ReviewImageCandidate = {
  url?: string | null;
  sourceUrl?: string | null;
  sourceType?: ImageCandidateSourceType | null;
  title?: string | null;
  note?: string | null;
  discoveredAt?: string | null;
  status?: "candidate" | "adopted" | "rejected" | string | null;
};

export type EditableReviewData = {
  name: string;
  price: number | null;
  priceText: string;
  shopName: string;
  areaName: string;
  category: string;
  description: string;
  imageUrl: string;
  imageSourceUrl: string;
  imageCandidates: ReviewImageCandidate[];
  imageReviewStatus: ImageReviewValue;
  imageReviewNote: string;
  imageCheckedAt: string | null;
  sourceUrl: string;
  officialReferenceUrls: string[];
  collectionId: string;
  reviewStatus: string;
  unconfirmedFields: string[];
  duplicateHandling: string;
  priceVariants: ReviewPriceVariant[];
};

export type ReviewDecision = {
  proposedId: string;
  decision: ReviewDecisionValue;
  editedData: EditableReviewData;
  targetType: TargetType;
  existingFoodId: string | null;
  duplicateAction: DuplicateAction;
  imageReview: ImageReviewValue;
  priceReview: PriceVerificationStatus;
  reviewerNote: string;
  reviewedAt: string | null;
};

export type ReviewDecisionFile = {
  schemaVersion: 1;
  sourceDraftFile: string;
  generatedAt: string;
  updatedAt: string;
  decisions: ReviewDecision[];
};

export type ImportReadyFile = {
  schemaVersion: 1;
  sourceDecisionFile: string;
  generatedAt: string;
  itemCount: number;
  items: ReviewDecision[];
};

export type RegistrationCheckIssue = {
  proposedId: string;
  name: string;
  reason: string;
};

export type ExcludedReviewItem = {
  name: string;
  reason: string;
  sourceUrl: string | null;
  plannedFoodId: string | null;
  duplicateHandling: string;
  registrationPolicy: string;
  imageUrl: string | null;
  imageSourceUrl: string | null;
};

export type SourceFileInfo = {
  path: string;
  size: number;
  updatedAt: string;
};

export type SaveReviewDecisionsResult =
  | {
      ok: true;
      message: string;
      savedAt: string;
      decisions: ReviewDecision[];
      importReadyCount: number;
      issues: RegistrationCheckIssue[];
    }
  | {
      ok: false;
      message: string;
    };
