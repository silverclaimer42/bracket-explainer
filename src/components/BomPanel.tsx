import { useEffect, useRef } from 'react';
import { formatMass, lineMassKg, totalMassKg } from '../data/bom';
import { useDemo } from '../state/DemoProvider';
import type { PartId } from '../types';

export function BomPanel() {
  const { items, activeId, selectedId, select, setHovered } = useDemo();
  const activeRow = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    activeRow.current?.scrollIntoView({ block: 'nearest' });
  }, [activeId]);

  return (
    <section className="bom" aria-label="Bill of materials">
      <div className="panel-heading">
        <h2>Bill of materials</h2>
        <p>{formatMass(totalMassKg(items))} nominal</p>
      </div>
      <div className="bom-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Part</th>
              <th scope="col" className="num">
                Qty
              </th>
              <th scope="col" className="num">
                Mass
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const active = item.id === activeId;
              const selected = item.id === selectedId;
              return (
                <tr
                  key={item.id}
                  ref={active ? activeRow : undefined}
                  data-part={item.id}
                  className={active ? 'is-active' : undefined}
                  tabIndex={0}
                  aria-selected={selected}
                  onClick={() => select(item.id as PartId)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      select(item.id);
                    }
                  }}
                  onMouseEnter={() => setHovered(item.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <td>
                    <strong>{item.name}</strong>
                    <span className="part-no">{item.partNo}</span>
                    <span className="material">{item.material}</span>
                  </td>
                  <td className="num">{item.qty}</td>
                  <td className="num">
                    {formatMass(item.unitMassKg)}
                    {item.qty > 1 ? <span className="line-mass">{formatMass(lineMassKg(item))} total</span> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
