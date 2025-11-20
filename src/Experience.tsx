import { Physics } from '@react-three/rapier'
import useGame from './stores/useGame'
import Lights from './Lights'
import { KeyboardControls } from '@react-three/drei'
import { Level } from './Level'
import Player from './Player'

export default function Experience()
{
  const blocksCount = useGame((state) => state.blocksCount)
  const blocksSeed = useGame(state => state.blocksSeed)

  return <>
    <KeyboardControls
      // 在这里定义键盘映射
      map={[
        { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
        { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
        { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
        { name: 'right', keys: ['ArrowRight', 'KeyD'] },
        { name: 'jump', keys: ['Space'] },
        { name: 'sprint', keys: ['ControlLeft', 'ControlRight'] } // Ctrl 键映射
      ]}>
      <color args={ [ '#bdedfc' ] } attach="background" />

      <Physics debug={ false }>
        <Lights />
        <Level count={ blocksCount } seed={ blocksSeed } />
            
        <Player />
      </Physics>
    </KeyboardControls>
  </>
}