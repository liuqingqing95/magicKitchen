import { KeyboardControls } from '@react-three/drei'

export function Controls() {
  return (
    <KeyboardControls
      // 在这里定义键盘映射
      map={[
        { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
        { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
        { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
        { name: 'right', keys: ['ArrowRight', 'KeyD'] },
        { name: 'jump', keys: ['Space'] },
        { name: 'sprint', keys: ['ControlLeft', 'ControlRight'] } // Ctrl 键映射
      ]}
    />
  )
}