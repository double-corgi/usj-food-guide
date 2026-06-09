"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { localReviewLastSubmitKey, readLocalFoodReviews, writeLocalFoodReviews } from "@/lib/local-user-data";

export type ReviewRatingKey = "taste" | "satisfaction" | "value" | "photo" | "access";

export type FoodReviewRatings = Record<ReviewRatingKey, number>;

export type FoodReview = {
  id: string;
  foodId: string;
  ratings: FoodReviewRatings;
  comment: string;
  createdAt: string;
  reports: number;
  hidden: boolean;
};

const defaultRatings: FoodReviewRatings = {
  taste: 4,
  satisfaction: 4,
  value: 3,
  photo: 4,
  access: 3
};

const ngWords = [
  "死ね",
  "殺す",
  "消えろ",
  "馬鹿",
  "バカ",
  "fuck",
  "shit",
  "kill",
  "spam",
  "scam"
];

const urlPattern = /(https?:\/\/|www\.|\.com|\.net|\.jp|\.io|\.xyz)/i;
const markupPattern = /<\s*\/?\s*[a-z][^>]*>|javascript:|onerror\s*=|onload\s*=|<\s*script/i;

function isRatings(value: unknown): value is FoodReviewRatings {
  if (!value || typeof value !== "object") return false;
  const ratings = value as Partial<FoodReviewRatings>;
  return (["taste", "satisfaction", "value", "photo", "access"] as ReviewRatingKey[]).every((key) => isValidRating(ratings[key]));
}

function isValidRating(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

function sanitizeComment(value: string) {
  return value.replace(/\u0000/g, "").replace(/\s+/g, " ").trim().slice(0, 240);
}

function validateReview(foodId: string, ratings: FoodReviewRatings, comment: string, reviews: FoodReview[]) {
  if (!isRatings(ratings)) return "評価は1〜5で入力してください。";
  const normalized = sanitizeComment(comment);
  if (normalized.length < 3) return "コメントは3文字以上で入力してください。";
  if (markupPattern.test(normalized)) return "HTMLやスクリプトを含む投稿はできません。";
  if (urlPattern.test(normalized)) return "レビュー本文にURLは入力できません。";
  const lower = normalized.toLowerCase();
  if (ngWords.some((word) => lower.includes(word.toLowerCase()))) return "不適切な表現が含まれています。";
  const latestForFood = reviews
    .filter((review) => review.foodId === foodId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (latestForFood && Date.now() - new Date(latestForFood.createdAt).getTime() < 10 * 60 * 1000) {
    return "同じ商品への連続投稿は少し時間を空けてください。";
  }
  const lastSubmit = Number(window.localStorage.getItem(localReviewLastSubmitKey) ?? 0);
  if (lastSubmit && Date.now() - lastSubmit < 30 * 1000) return "連続投稿は少し時間を空けてください。";
  return null;
}

function makeReviewId(foodId: string) {
  return `${foodId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useFoodReviews(foodId?: string) {
  const [reviews, setReviews] = useState<FoodReview[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setReviews(readLocalFoodReviews());
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const persistReviews = useCallback((nextReviews: FoodReview[]) => {
    try {
      writeLocalFoodReviews(nextReviews);
      setReviews(nextReviews);
      setError(null);
    } catch (storageError) {
      setError(storageError instanceof Error ? storageError.message : "レビューの端末内保存に失敗しました。");
    }
  }, []);

  const visibleReviews = useMemo(() => reviews.filter((review) => !review.hidden), [reviews]);
  const currentFoodReviews = useMemo(
    () => (foodId ? visibleReviews.filter((review) => review.foodId === foodId) : visibleReviews),
    [foodId, visibleReviews]
  );
  const summary = useMemo(() => calculateReviewSummary(currentFoodReviews), [currentFoodReviews]);

  const addReview = useCallback((targetFoodId: string, ratings: FoodReviewRatings, comment: string) => {
    const validationError = validateReview(targetFoodId, ratings, comment, reviews);
    if (validationError) return { ok: false, error: validationError };
    const review: FoodReview = {
      id: reviews.find((item) => item.foodId === targetFoodId)?.id ?? makeReviewId(targetFoodId),
      foodId: targetFoodId,
      ratings,
      comment: sanitizeComment(comment),
      createdAt: new Date().toISOString(),
      reports: 0,
      hidden: false
    };
    const nextReviews = [review, ...reviews.filter((item) => item.foodId !== targetFoodId)];
    persistReviews(nextReviews);
    window.localStorage.setItem(localReviewLastSubmitKey, String(Date.now()));
    return { ok: true, review };
  }, [persistReviews, reviews]);

  const reportReview = useCallback((reviewId: string) => {
    const nextReviews = reviews.map((review) => (review.id === reviewId ? { ...review, reports: review.reports + 1 } : review));
    persistReviews(nextReviews);
  }, [persistReviews, reviews]);

  const toggleHidden = useCallback((reviewId: string) => {
    const nextReviews = reviews.map((review) => (review.id === reviewId ? { ...review, hidden: !review.hidden } : review));
    persistReviews(nextReviews);
  }, [persistReviews, reviews]);

  return {
    ready,
    reviews,
    visibleReviews,
    currentFoodReviews,
    summary,
    defaultRatings,
    isAuthenticated: true,
    error,
    addReview,
    reportReview,
    toggleHidden
  };
}

export function calculateReviewSummary(reviews: FoodReview[]) {
  const visible = reviews.filter((review) => !review.hidden);
  if (visible.length === 0) {
    return {
      count: 0,
      average: 0,
      ratings: { taste: 0, satisfaction: 0, value: 0, photo: 0, access: 0 } satisfies FoodReviewRatings
    };
  }
  const totals = visible.reduce(
    (sum, review) => ({
      taste: sum.taste + review.ratings.taste,
      satisfaction: sum.satisfaction + review.ratings.satisfaction,
      value: sum.value + review.ratings.value,
      photo: sum.photo + review.ratings.photo,
      access: sum.access + review.ratings.access
    }),
    { taste: 0, satisfaction: 0, value: 0, photo: 0, access: 0 }
  );
  const ratings = {
    taste: roundOne(totals.taste / visible.length),
    satisfaction: roundOne(totals.satisfaction / visible.length),
    value: roundOne(totals.value / visible.length),
    photo: roundOne(totals.photo / visible.length),
    access: roundOne(totals.access / visible.length)
  };
  const average = roundOne((ratings.taste + ratings.satisfaction + ratings.value + ratings.photo + ratings.access) / 5);
  return { count: visible.length, average, ratings };
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}
