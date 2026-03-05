# Rendering and Editing

````mermaid
sequenceDiagram
  autonumber
  actor User
  participant Canvas as CanvasComponent
  participant Edit as EditService
  participant Spec as SpectrogramService

  opt User draws edits
   User->>Canvas: edit Gesture
   Canvas->>Edit: addEdit(edit)
  
  end



  opt User undoes
   User->>Canvas: undo button
   Canvas->>Edit: undoEdit()
  end

  opt User redoes
   User->>Canvas: redo button
   Canvas->>Edit: redoEdit()
  end



  opt User explores result (gestures)
    User->>Canvas: Pan / zoom gesture
    Canvas->>Canvas: Update viewport state
    Canvas->>Canvas: Schedule draw
    Canvas->>Spec: Render(renderModel, viewport)
    Spec->>Edit: getEdits()
    Edit-->>Spec: edits
    Spec->>Spec: addEdits(renderModel)
    Spec->>Spec: render(renderModel, viewport)
    Spec-->>Canvas: Pixels painted
    
  end

````
