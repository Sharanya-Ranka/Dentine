-- Seed data for medication_catalog
insert into public.medication_catalog (
  name,
  generic_name,
  default_dosage,
  default_frequency,
  default_duration_days,
  default_instructions
) values
  -- Antibiotics & Anti-infectives
  ('Amoxicillin', 'Amoxicillin Trihydrate', '500 mg', 'TID (Every 8 hours)', 7, 'Take with or after food. Complete entire course.'),
  ('Augmentin', 'Amoxicillin / Clavulanic Acid', '625 mg', 'BID (Twice daily)', 5, 'Take at the start of a meal to prevent GI upset.'),
  ('Azithromycin', 'Azithromycin Monohydrate', '500 mg', 'OD (Once daily)', 3, 'Take 1 hour before or 2 hours after meals.'),
  ('Ciprofloxacin', 'Ciprofloxacin HCl', '500 mg', 'BID (Twice daily)', 5, 'Avoid taking with dairy products or antacids.'),
  ('Metronidazole', 'Metronidazole', '400 mg', 'TID (Every 8 hours)', 5, 'Take after meals. Strictly avoid alcohol during treatment.'),
  ('Doxycycline', 'Doxycycline Hyclate', '100 mg', 'BID (Twice daily)', 7, 'Take with a full glass of water. Do not lie down for 30 minutes.'),
  ('Cephalexin', 'Cephalexin Monohydrate', '500 mg', 'QID (Every 6 hours)', 7, 'Take consistently around the clock with plenty of water.'),

  -- Analgesics & Anti-inflammatories (NSAIDs)
  ('Paracetamol', 'Acetaminophen', '650 mg', 'SOS / TID (Every 8 hrs prn)', 3, 'Take after food. Do not exceed 4000 mg in 24 hours.'),
  ('Ibuprofen', 'Ibuprofen', '400 mg', 'TID (Every 8 hours)', 3, 'Take strictly after food or with milk to protect stomach lining.'),
  ('Combiflam', 'Ibuprofen + Paracetamol', '400 mg / 325 mg', 'TID (Every 8 hours)', 3, 'Take after meals for acute pain and inflammation.'),
  ('Aceclofenac + Paracetamol', 'Aceclofenac + Paracetamol', '100 mg / 325 mg', 'BID (Twice daily)', 3, 'Take after food. Stop once pain subsides.'),
  ('Tramadol + Paracetamol', 'Tramadol HCl + Acetaminophen', '37.5 mg / 325 mg', 'SOS (As needed)', 3, 'Use only for severe breakthrough pain. May cause drowsiness.'),
  ('Ketorolac', 'Ketorolac Tromethamine', '10 mg', 'QID (Every 6 hrs prn)', 3, 'Short-term use only for moderate to severe acute pain.'),

  -- Gastrointestinal / PPIs
  ('Pantoprazole', 'Pantoprazole Sodium', '40 mg', 'OD (Once daily)', 14, 'Take 30 minutes before morning breakfast on an empty stomach.'),
  ('Omeprazole', 'Omeprazole', '20 mg', 'OD (Once daily)', 14, 'Take early morning on an empty stomach with a glass of water.'),
  ('Rabeprazole + Domperidone', 'Rabeprazole + Domperidone SR', '20 mg / 30 mg', 'OD (Once daily)', 10, 'Take 30 to 45 minutes before first meal of the day.'),
  ('Ondansetron', 'Ondansetron HCl', '4 mg', 'BID / SOS', 2, 'Take 30 minutes before meals or when experiencing nausea.'),
  ('Sucralfate Suspension', 'Sucralfate', '1000 mg / 10 ml', 'QID (Before meals & bedtime)', 7, 'Take on an empty stomach 1 hour before meals. Shake well.'),

  -- Antihistamines & Respiratory
  ('Cetirizine', 'Cetirizine HCl', '10 mg', 'OD (Once daily at bedtime)', 5, 'May cause mild drowsiness. Best taken before sleeping.'),
  ('Levocetirizine + Montelukast', 'Levocetirizine + Montelukast', '5 mg / 10 mg', 'OD (Once daily at night)', 10, 'Take at night. Do not consume alcohol concurrently.'),
  ('Fexofenadine', 'Fexofenadine HCl', '120 mg', 'OD (Once daily)', 7, 'Non-drowsy. Avoid taking with fruit juices (orange/grapefruit).'),

  -- Corticosteroids
  ('Prednisolone', 'Prednisolone', '20 mg', 'OD (Once daily morning)', 5, 'Take strictly with breakfast. Taper as directed by physician.'),
  ('Dexamethasone', 'Dexamethasone Sodium', '4 mg', 'OD (Once daily)', 3, 'Short course. Take with meals to minimize gastric irritation.'),

  -- Muscle Relaxants & Adjuvants
  ('Chlorzoxazone + Paracetamol', 'Chlorzoxazone + Paracetamol', '250 mg / 325 mg', 'BID (Twice daily)', 4, 'Take after food for muscle spasms. May cause mild drowsiness.'),
  ('Thiocolchicoside', 'Thiocolchicoside', '4 mg', 'BID (Twice daily)', 5, 'Take after meals for acute musculoskeletal pain and spasm.'),

  -- Oral Care & Topicals
  ('Chlorhexidine Gluconate 0.2%', 'Chlorhexidine Mouthwash', '10 ml', 'BID (Twice daily)', 14, 'Rinse vigorously for 60 seconds after brushing, then spit out. Do not swallow or eat for 30 minutes.'),
  ('Benzydamine Oral Rinse', 'Benzydamine HCl 0.15%', '15 ml', 'TID (Every 8 hours)', 7, 'Gargle or rinse for 30 seconds for local mucosal pain/inflammation.'),
  ('Choline Salicylate Gel', 'Choline Salicylate + Lignocaine', 'Topical Pea-sized', 'TID (Before meals prn)', 5, 'Apply topically to ulcer or lesion 10 minutes prior to meals.');