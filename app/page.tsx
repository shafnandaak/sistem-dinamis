import Image from "next/image";

export default function Home() {
  return (
    <div>

      <h1>Sistem Dinamis [Judul Penelitian]</h1>

      <p>
        Sistem dinamis adalah metode pemodelan untuk memahami
        perilaku sistem kompleks dari waktu ke waktu.
      </p>

      <h2>Causal Loop Diagram</h2>
      <img src="/cld.png" width="600"/>

      <h2>Stock Flow Diagram</h2>
      <img src="/sfd.png" width="600"/>

      <h2>Lokus Penelitian</h2>
      <img src="/map.png" width="600"/>

    </div>
  )
}
