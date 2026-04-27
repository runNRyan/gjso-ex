import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-[400px] h-[400px] rounded-full overflow-hidden">
        <Image
          src="/cow_crying.jpg"
          alt="울고 있는 소"
          width={600}
          height={600}
          className="object-cover w-full h-full scale-[2]"
        />
      </div>
      <h1 className="text-6xl font-bold text-gray-800">404</h1>
      <p className="text-lg text-gray-500">페이지를 찾을 수 없습니다</p>
      <Link
        href="/"
        className="mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
