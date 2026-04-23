# Regras de Desenvolvimento - Finanças Pro

1. **Alterações Cross-Page**: Antes de modificar qualquer código, arquivo ou funcionalidade que não pertença à página atual de trabalho, o assistente DEVE obrigatoriamente pedir permissão ao usuário e explicar o motivo da mudança.
2. **Consistência Visual**: Manter o design minimalista e polido, priorizando destaques em texto (negrito e cor primária) sobre fundos coloridos, conforme definido pelo usuário.
3. **Padrão de Layout Responsivo**:
    - **Desktop (>= 1025px)**: Uso de tabelas tradicionais (`<table>`) para listagens de dados.
    - **Mobile (<= 1024px)**: Uso de **Cards** dinâmicos. Campos secundários devem ser ocultos inicialmente e revelados através de um botão "Ver detalhes".
4. **Padrão de Ação (FAB)**: No mobile, a ação principal de criação deve ser um **FAB (Floating Action Button)** circular, fixado no canto inferior direito, sem bordas, com sombra projetada e ícone de 28px.
5. **Padrão de Modais (Bottom Sheet)**:
    - No mobile, o modal deve se comportar como um **Bottom Sheet** (gaveta), surgindo da base da tela com animação `slideUp`.
    - Deve incluir um "handle" (barra de arraste) no topo.
    - Botões de ação no mobile devem ser empilhados verticalmente (Ação principal no topo, Cancelar abaixo).
    - Todos os inputs devem ter `width: 100%`, `box-sizing: border-box` e `min-width: 0` para evitar transbordamento em dispositivos iOS.
