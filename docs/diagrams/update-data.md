# Update Data Definition

```mermaid
classDiagram
    class UpdateBase {
        activeUpdates: Update[]
        inactiveUpdates: Update[]
        combinedActiveUpdateBuffer: Float32[]    }

    class Update {
        +pixelMap: Map~InternalPixel, NewValue~
        +timestamp: Date
    }

    class InternalPixel {
        +x: number
        +y: number
    }

    class NewValue {
        +value: number
    }

    UpdateBase *-- "0..*" Update : contains
    Update *-- "0..*" InternalPixel : maps
    Update *-- "0..*" NewValue : maps


```

<!--     note for UpdateBase "Stores array of updates</br>with maximum length constraint"
    note for Update "Each update contains a map</br>of pixel-to-value mappings"
    note for InternalPixel "Represents a pixel position</br>in internal coordinate system"
    note for NewValue "Represents the new value</br>to assign to a pixel" -->