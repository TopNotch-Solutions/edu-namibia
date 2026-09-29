import type { LabId, LabProps } from '@/constants/lessonTypes';
import { ParticleHeaterLab } from './ParticleHeaterLab';

/**
 * Renders the lab a lesson points at.
 *
 * The `never` assignment in the default branch is the guarantee: add an id to
 * `LabId` without writing its case here and the build fails. STEM Academy used
 * an unchecked string lookup and shipped a lesson pointing at a lab nobody had
 * written — learners met a "Lab Not Available" card and nothing ever complained.
 */
export interface LabStageProps extends LabProps {
  labId: LabId;
}

export function LabStage({ labId, onGoalReached, onProgress }: LabStageProps) {
  switch (labId) {
    case 'PARTICLE_HEATER':
      return <ParticleHeaterLab onGoalReached={onGoalReached} onProgress={onProgress} />;
    default: {
      const unhandled: never = labId;
      throw new Error(`Unregistered lab: ${String(unhandled)}`);
    }
  }
}

export default LabStage;
