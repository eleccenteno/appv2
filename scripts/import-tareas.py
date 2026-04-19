import openpyxl
import json
import urllib.request

def main():
    print("📋 Leyendo archivo Excel...")
    wb = openpyxl.load_workbook('/home/z/my-project/upload/Tareas pendientes.xlsx', read_only=True, data_only=True)
    ws = wb['Hoja 1']
    rows = list(ws.iter_rows(values_only=True))
    wb.close()

    headers = rows[0]
    data_rows = [r for r in rows[1:] if any(v is not None for v in r)]
    print(f"   Encontradas {len(data_rows)} filas de datos")

    # Map Excel columns to task fields
    tareas = []
    for i, row in enumerate(data_rows):
        # Skip rows without essential data
        if not row[0] and not row[14]:
            continue

        tarea = {
            'rowNumber': i + 2,
            'nombreCentro': str(row[0]).strip() if row[0] else '',
            'codigoInfo': str(row[1]).strip() if row[1] else '',
            'provincia': str(row[2]).strip() if row[2] else '',
            'tipoCentro': str(row[3]).strip() if row[3] else '',
            'prioridad': str(row[4]).strip() if row[4] else '',
            'proyecto': str(row[5]).strip() if row[5] else '',
            'localizacion': str(row[6]).strip() if row[6] else '',
            'estado': str(row[7]).strip() if row[7] else 'Pendiente',
            'blackList': str(row[8]).strip() if row[8] else 'No',
            'tipoTarea': str(row[9]).strip() if row[9] else '',
            'prioridadTarea': str(row[10]).strip() if row[10] else '',
            'fecha': None,
            'fechaRealizacion': None,
            'tecnico': str(row[13]).strip() if row[13] else '',
            'trabajoRealizar': str(row[14]).strip() if row[14] else '',
            'tecnicoRealiza': str(row[15]).strip() if len(row) > 15 and row[15] else '',
            'trabajoRealizado': str(row[16]).strip() if len(row) > 16 and row[16] else '',
        }

        # Handle dates
        if row[11]:
            if hasattr(row[11], 'isoformat'):
                tarea['fecha'] = row[11].isoformat()
            else:
                tarea['fecha'] = str(row[11])

        if len(row) > 12 and row[12]:
            if hasattr(row[12], 'isoformat'):
                tarea['fechaRealizacion'] = row[12].isoformat()
            else:
                tarea['fechaRealizacion'] = str(row[12])

        # Handle photos
        for f in range(10):
            col_idx = 17 + f
            if len(row) > col_idx and row[col_idx]:
                tarea[f'fotografia{f + 1}'] = str(row[col_idx]).strip()

        # Normalize Black List: 'Si' -> 'Sí'
        if tarea['blackList'] == 'Si':
            tarea['blackList'] = 'Sí'

        tareas.append(tarea)

    print(f"   Preparadas {len(tareas)} tareas para importar")

    # Send to API in batches of 50
    batch_size = 50
    total_created = 0
    total_skipped = 0
    total_errors = []
    total_centros = 0
    total_empleados = 0

    for batch_start in range(0, len(tareas), batch_size):
        batch = tareas[batch_start:batch_start + batch_size]
        batch_num = batch_start // batch_size + 1
        total_batches = (len(tareas) + batch_size - 1) // batch_size

        print(f"\n📦 Enviando lote {batch_num}/{total_batches} ({len(batch)} tareas)...")

        data = json.dumps({'tareas': batch}).encode('utf-8')
        req = urllib.request.Request(
            'http://127.0.0.1:3000/api/tareas/import',
            data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )

        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                total_created += result['results']['created']
                total_skipped += result['results']['skipped']
                total_centros += result['results']['centrosCreated']
                total_empleados += result['results']['empleadosCreated']
                total_errors.extend(result['results']['errors'])
                print(f"   ✅ {result['results']['created']} creadas, {result['results']['skipped']} omitidas")
                if result['results']['centrosCreated']:
                    print(f"   📍 {result['results']['centrosCreated']} nuevos centros")
                if result['results']['empleadosCreated']:
                    print(f"   👷 {result['results']['empleadosCreated']} nuevos empleados")
        except Exception as e:
            print(f"   ❌ Error en lote: {e}")
            total_errors.append(f"Lote {batch_num}: {e}")

    print("\n" + "=" * 60)
    print("📊 RESUMEN DE IMPORTACIÓN")
    print("=" * 60)
    print(f"   ✅ Tareas creadas:     {total_created}")
    print(f"   ⏭️  Tareas omitidas:    {total_skipped}")
    print(f"   📍 Centros creados:    {total_centros}")
    print(f"   👷 Empleados creados:  {total_empleados}")

    if total_errors:
        print(f"\n   ⚠️  Errores ({len(total_errors)}):")
        for err in total_errors[:20]:
            print(f"      - {err}")
        if len(total_errors) > 20:
            print(f"      ... y {len(total_errors) - 20} más")

    print("=" * 60)

if __name__ == '__main__':
    main()
