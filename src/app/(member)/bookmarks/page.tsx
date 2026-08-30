import { getMyBookmarkedCourses } from '@/actions/bookmarks';
import BookmarksClientUI from './BookmarksClientUI';

export default async function BookmarksPage() {
  const courses = await getMyBookmarkedCourses();
  return (
    <BookmarksClientUI
      courses={courses.map((c: any) => ({ id: c.id, title: c.title, description: c.description }))}
    />
  );
}
