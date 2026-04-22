def merge_annotations(annotations: list[dict]) -> dict:
    """
    Merge list of chunk annotations into a single document-wide result.
    Deduplicates entities and calculates average confidence.
    """
    all_entities = []
    total_confidence = 0
    valid_chunks = 0
    
    for ann in annotations:
        if "confidence" in ann:
            total_confidence += ann["confidence"]
            valid_chunks += 1
            
        # Parse the JSON string
        import json
        try:
            data = json.loads(ann["annotation"])
            if "entities" in data:
                all_entities.extend(data["entities"])
        except:
            pass

    # Deduplicate entities (basic implementation)
    unique_entities = []
    seen = set()
    for ent in all_entities:
        key = f"{ent.get('type')}_{ent.get('value')}"
        if key not in seen:
            seen.add(key)
            unique_entities.append(ent)
            
    mean_confidence = total_confidence / valid_chunks if valid_chunks > 0 else 0
            
    return {
        "merged_entities": unique_entities,
        "mean_confidence": round(mean_confidence, 2),
        "total_chunks_processed": len(annotations)
    }
