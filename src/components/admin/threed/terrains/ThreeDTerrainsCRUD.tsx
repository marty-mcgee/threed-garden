import { TerrainEditor } from './TerrainEditor';
import { TerrainsList } from './TerrainsList';

type ThreeDTerrainsCRUDProps =
  | { view: 'list' }
  | { view: 'create' }
  | { view: 'edit'; recordId: number };

export function ThreeDTerrainsCRUD(props: ThreeDTerrainsCRUDProps) {
  if (props.view === 'list') return <TerrainsList />;
  if (props.view === 'create') return <TerrainEditor />;
  return <TerrainEditor recordId={props.recordId} />;
}
