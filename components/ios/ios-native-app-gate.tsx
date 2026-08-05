"use client";

import { useEffect, useState } from "react";
import { IosNativeApp } from "@/components/ios/ios-native-app";
import { isNativeIosApp } from "@/lib/ios/native";
import type { Area, FoodCollection, FoodWithRelations } from "@/types/domain";

export function IosNativeAppGate({
  foods,
  activeCollectionFoods,
  collections,
  areas,
  children
}: {
  foods: FoodWithRelations[];
  activeCollectionFoods: FoodWithRelations[];
  collections: FoodCollection[];
  areas: Area[];
  children: React.ReactNode;
}) {
  const [native, setNative] = useState(() => isNativeIosApp());

  useEffect(() => {
    const enabled = isNativeIosApp();
    if (enabled) document.documentElement.setAttribute("data-ios-native", "active");
    queueMicrotask(() => setNative(enabled));
    return () => document.documentElement.removeAttribute("data-ios-native");
  }, []);

  if (!native) return <>{children}</>;
  return <IosNativeApp foods={foods} activeCollectionFoods={activeCollectionFoods} collections={collections} areas={areas} />;
}
