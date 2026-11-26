import {
  AvatarAppearanceSchema,
  ScriptSegmentSchema,
  type AvatarDto,
  type ScriptSegment,
  type VoiceGender,
} from '@induction/shared';
import type { Avatar, Prisma } from '@prisma/client';
import { z } from 'zod';

export function toAvatarDto(avatar: Avatar): AvatarDto {
  const appearance = AvatarAppearanceSchema.safeParse(avatar.appearance);
  const gender: VoiceGender = avatar.voiceGender === 'male' ? 'male' : 'female';
  const look = appearance.success ? appearance.data : AvatarAppearanceSchema.parse({});
  return {
    id: avatar.id,
    name: avatar.name,
    title: avatar.title,
    themeColor: avatar.themeColor,
    personalityNotes: avatar.personalityNotes,
    defaultEmotion: avatar.defaultEmotion,
    entryGesture: avatar.entryGesture,
    exitGesture: avatar.exitGesture,
    energy: avatar.energy,
    // Presenters saved before body shapes existed take the figure that matches their voice.
    appearance: { ...look, figure: look.figure ?? (gender === 'male' ? 'masculine' : 'feminine') },
    voice: { gender, lang: avatar.voiceLang, pitch: avatar.voicePitch, rate: avatar.voiceRate },
  };
}

const StoredSegments = z.array(ScriptSegmentSchema);

/** Reads the segments JSON column; anything malformed becomes an empty script. */
export function toSegments(value: Prisma.JsonValue): ScriptSegment[] {
  const parsed = StoredSegments.safeParse(value);
  return parsed.success ? parsed.data : [];
}
