export type Data = { id: number; name: string };
export async function mockApi(id: number) {
  let data = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' },
    { id: 3, name: 'Alice' },
    { id: 4, name: 'Bob' },
    { id: 5, name: 'Charlie' },
  ];
  let timeout: any;
  await new Promise((res) => {
    timeout = setTimeout(res, 1000);
  });
  let notFound = { id: 0, name: 'Not Found' };
  return {
    data: data.find((item) => item.id === id) || notFound,
    clear: (log = false) => {
      if (log) {
        console.log('Cleared');
      }
      clearTimeout(timeout);
    },
  };
}
